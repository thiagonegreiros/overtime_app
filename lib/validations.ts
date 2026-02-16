import { z } from 'zod';

export const overtimeEntrySchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  type: z.enum(['worked', 'used'], {
    required_error: 'Tipo é obrigatório',
  }),
  hours: z.number().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato inválido (HH:mm)').optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato inválido (HH:mm)').optional(),
  description: z.string().max(500, 'Descrição muito longa').optional(),
}).refine(
  (data) => data.hours !== undefined || (data.startTime && data.endTime),
  {
    message: 'Forneça horas ou horário de entrada/saída',
    path: ['hours'],
  }
).refine(
  (data) => {
    if (data.startTime && data.endTime) {
      const [startHour, startMin] = data.startTime.split(':').map(Number);
      const [endHour, endMin] = data.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      return endMinutes > startMinutes;
    }
    return true;
  },
  {
    message: 'Horário de saída deve ser maior que entrada',
    path: ['endTime'],
  }
);

export type OvertimeEntryInput = z.infer<typeof overtimeEntrySchema>;
