import { describe, it, expect } from 'vitest';
import { formFromSlot, formFromEvent, payloadFromForm } from './eventForm';

const d = (y, m, day, h = 0, min = 0) => new Date(y, m - 1, day, h, min);

describe('formFromSlot', () => {
  it('starts a one-hour event at the clicked time', () => {
    const f = formFromSlot(d(2026, 11, 2, 9, 30));
    expect([f.date, f.startTime, f.endTime]).toEqual(['2026-11-02', '09:30', '10:30']);
  });

  it('stops at 11:59 PM instead of running past midnight', () => {
    expect(formFromSlot(d(2026, 11, 2, 23, 30)).endTime).toBe('23:59');
  });
});

describe('payloadFromForm', () => {
  const base = () => ({ ...formFromSlot(d(2026, 11, 2, 10)), title: 'COSC 369' });

  it('builds ISO timestamps from local date and times', () => {
    const { payload, error } = payloadFromForm(base());
    expect(error).toBe(undefined);
    expect(payload.start_time).toBe(d(2026, 11, 2, 10).toISOString());
    expect(payload.end_time).toBe(d(2026, 11, 2, 11).toISOString());
    expect(payload.recurrence_days).toBe(null);
    expect(payload.recurrence_until).toBe(null);
  });

  it('requires a title, a valid date and an end after the start', () => {
    expect(payloadFromForm({ ...base(), title: '  ' }).error).toBe('Give the event a title.');
    expect(payloadFromForm({ ...base(), date: '' }).error).toBe('Pick a date.');
    expect(payloadFromForm({ ...base(), date: '2026-02-30' }).error).toBe('Pick a date.');
    expect(payloadFromForm({ ...base(), endTime: '10:00' }).error).toBe('The end time must be after the start time.');
    expect(payloadFromForm({ ...base(), startTime: '' }).error).toBe('Enter a start and end time.');
  });

  it('makes an all-day event span the whole local day', () => {
    const { payload } = payloadFromForm({ ...base(), allDay: true });
    expect(payload.all_day).toBe(true);
    expect(payload.start_time).toBe(d(2026, 11, 2).toISOString());
    expect(payload.end_time).toBe(d(2026, 11, 3).toISOString());
  });

  it('sends sorted unique weekdays and an end-of-day "until" for repeating events', () => {
    const { payload } = payloadFromForm({ ...base(), repeatDays: [3, 1, 3], repeatUntil: '2026-12-11' });
    expect(payload.recurrence_days).toEqual([1, 3]);
    expect(payload.recurrence_until).toBe(new Date(2026, 11, 11, 23, 59, 59).toISOString());
  });

  it('ignores "repeat until" when no weekdays are chosen, and rejects an until before the start', () => {
    expect(payloadFromForm({ ...base(), repeatUntil: '2026-12-11' }).payload.recurrence_until).toBe(null);
    const r = payloadFromForm({ ...base(), repeatDays: [1], repeatUntil: '2026-10-01' });
    expect(r.error).toBe('“Repeat until” must be on or after the first date.');
  });
});

describe('formFromEvent', () => {
  it('round-trips a stored recurring event through the form', () => {
    const stored = {
      title: 'Algorithms',
      notes: 'Bring laptop',
      start_time: d(2026, 11, 2, 10).toISOString(),
      end_time: d(2026, 11, 2, 11, 15).toISOString(),
      all_day: false,
      color: '#0f8b7d',
      recurrence_days: [1, 3],
      recurrence_until: new Date(2026, 11, 11, 23, 59, 59).toISOString(),
    };
    const form = formFromEvent(stored);
    expect([form.date, form.startTime, form.endTime, form.repeatUntil]).toEqual(['2026-11-02', '10:00', '11:15', '2026-12-11']);
    const { payload } = payloadFromForm(form);
    expect(payload).toEqual({ ...stored });
  });

  it('fills defaults when optional fields are null', () => {
    const form = formFromEvent({
      title: 'Birthday',
      notes: '',
      start_time: d(2026, 11, 2).toISOString(),
      end_time: d(2026, 11, 3).toISOString(),
      all_day: true,
      color: null,
      recurrence_days: null,
      recurrence_until: null,
    });
    expect(form.allDay).toBe(true);
    expect(form.repeatDays).toEqual([]);
    expect(form.color).toBe('#3a5bdb');
  });
});
