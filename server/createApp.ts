import express from "express";
import { clinicDb } from "./clinicDb.js";
import { processReceptionistChat } from "./aiReceptionist.js";

export function createApiApp() {
  const app = express();
  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // 1. Clinic General Info
  app.get("/api/clinic", (req, res) => {
    res.json({
      info: clinicDb.clinicInfo,
      faq: clinicDb.faq,
      reminderSettings: clinicDb.reminderSettings
    });
  });

  // 2. Services
  app.get("/api/services", (req, res) => {
    res.json(clinicDb.services);
  });

  app.post("/api/services", (req, res) => {
    const { name, duration, price, description, category, doctorIds } = req.body;
    if (!name || !price) {
      return res.status(400).json({ error: "Название и цена обязательны" });
    }
    const newService = {
      id: `srv-${Date.now().toString().slice(-5)}`,
      name: name.trim(),
      duration: Number(duration) || 45,
      price: Number(price) || 10000,
      description: description || "",
      category: category || "general",
      doctorIds: Array.isArray(doctorIds) && doctorIds.length > 0 ? doctorIds : [clinicDb.doctors[0].id],
      active: true
    };
    clinicDb.services.push(newService);
    res.status(201).json(newService);
  });

  app.put("/api/services/:id", (req, res) => {
    const { id } = req.params;
    const index = clinicDb.services.findIndex(s => s.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Услуга не найдена" });
    }
    clinicDb.services[index] = {
      ...clinicDb.services[index],
      ...req.body
    };
    res.json(clinicDb.services[index]);
  });

  app.delete("/api/services/:id", (req, res) => {
    const { id } = req.params;
    const s = clinicDb.services.find(item => item.id === id);
    if (!s) return res.status(404).json({ error: "Услуга не найдена" });
    s.active = false;
    res.json({ success: true, message: "Услуга архивирована" });
  });

  // 3. Doctors
  app.get("/api/doctors", (req, res) => {
    res.json(clinicDb.doctors);
  });

  app.put("/api/doctors/:id", (req, res) => {
    const { id } = req.params;
    const index = clinicDb.doctors.findIndex(d => d.id === id);
    if (index === -1) return res.status(404).json({ error: "Врач не найден" });
    clinicDb.doctors[index] = {
      ...clinicDb.doctors[index],
      ...req.body
    };
    res.json(clinicDb.doctors[index]);
  });

  app.post("/api/doctors/:id/portfolio", (req, res) => {
    const { id } = req.params;
    const doc = clinicDb.doctors.find(d => d.id === id);
    if (!doc) return res.status(404).json({ error: "Врач не найден" });
    const { title, category, description, beforeImage, afterImage, durationText, tags } = req.body;
    if (!title || !beforeImage || !afterImage) {
      return res.status(400).json({ error: "Заполните название и фотографии До/После" });
    }
    const newCase = {
      id: `case-${id}-${Date.now()}`,
      title: title.trim(),
      category: category || "Клинический случай",
      description: description || "",
      beforeImage,
      afterImage,
      durationText: durationText || "1 визит",
      tags: Array.isArray(tags) && tags.length > 0 ? tags : ["Клинический случай"]
    };
    if (!doc.portfolio) doc.portfolio = [];
    doc.portfolio.unshift(newCase);
    res.status(201).json(newCase);
  });

  // 4. Appointments
  app.get("/api/appointments", (req, res) => {
    res.json(clinicDb.appointments);
  });

  app.post("/api/appointments", (req, res) => {
    const { patientName, patientPhone, serviceId, doctorId, date, time, notes } = req.body;
    if (!patientName || !patientPhone || !serviceId || !doctorId || !date || !time) {
      return res.status(400).json({ error: "Все поля записи обязательны для заполнения" });
    }
    const result = clinicDb.createAppointment({
      patientName,
      patientPhone,
      serviceId,
      doctorId,
      date,
      time,
      notes
    });
    if (!result.success) {
      return res.status(409).json({ error: result.error });
    }
    res.status(201).json(result.appointment);
  });

  app.delete("/api/appointments/:id", (req, res) => {
    const ok = clinicDb.cancelAppointment(req.params.id);
    if (!ok) return res.status(404).json({ error: "Запись не найдена" });
    res.json({ success: true });
  });

  // 5. Available Slots query
  app.get("/api/slots", (req, res) => {
    const { serviceId, doctorId, date } = req.query;
    const targetDate = (date as string) || "2026-09-22";
    const slots = clinicDb.getAvailableSlots({
      serviceId: serviceId as string,
      doctorId: doctorId as string,
      date: targetDate
    });
    res.json({
      date: targetDate,
      slots,
      total: slots.length
    });
  });

  // 6. AI Receptionist Chat Endpoint
  app.post("/api/chat", async (req, res) => {
    const { message, history } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Сообщение не должно быть пустым" });
    }

    try {
      const response = await processReceptionistChat(message, history || []);
      res.json(response);
    } catch (err: any) {
      console.error("Chat error:", err);
      res.status(500).json({
        replyText: "Произошла временная заминка. Пожалуйста, напишите еще раз или свяжитесь с нами по телефону +7 (727) 345-67-89."
      });
    }
  });

  // 7. Reminders
  app.get("/api/reminders", (req, res) => {
    res.json({
      settings: clinicDb.reminderSettings,
      logs: clinicDb.reminderLogs
    });
  });

  app.post("/api/reminders/settings", (req, res) => {
    clinicDb.reminderSettings = {
      ...clinicDb.reminderSettings,
      ...req.body
    };
    res.json(clinicDb.reminderSettings);
  });

  app.post("/api/reminders/trigger-test", (req, res) => {
    const { appointmentId, type } = req.body;
    const apt = clinicDb.appointments.find(a => a.id === appointmentId) || clinicDb.appointments[0];
    if (!apt) return res.status(404).json({ error: "Запись не найдена" });

    const message = type === "2h"
      ? `Напоминаем, что сегодня в ${apt.time} у вас приём в стоматологии DentaCare (${apt.serviceName}, ${apt.doctorName}).`
      : `Здравствуйте, ${apt.patientName}! Напоминаем, что завтра в ${apt.time} у вас приём в нашей стоматологии (${apt.serviceName}, врач ${apt.doctorName}). Наш адрес: пр. Достык 128.`;

    const newLog = {
      id: `rem-test-${Date.now()}`,
      appointmentId: apt.id,
      patientName: apt.patientName,
      patientPhone: apt.patientPhone,
      type: type || "24h",
      scheduledTime: new Date().toISOString(),
      sentAt: new Date().toISOString(),
      channel: (clinicDb.reminderSettings.whatsappEnabled ? "WhatsApp" : "SMS") as "WhatsApp" | "SMS",
      messageText: message,
      status: "sent" as const
    };

    clinicDb.reminderLogs.unshift(newLog);
    res.json({ success: true, log: newLog });
  });

  // 8. FAQ management
  app.post("/api/faq", (req, res) => {
    const { question, answer, category } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ error: "Вопрос и ответ обязательны" });
    }
    const newItem = {
      id: `faq-${Date.now()}`,
      question: question.trim(),
      answer: answer.trim(),
      category: category || "general"
    };
    clinicDb.faq.push(newItem);
    res.status(201).json(newItem);
  });

  return app;
}
