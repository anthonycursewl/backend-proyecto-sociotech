import { AppointmentService } from './appointment.service';
import type { AppointmentRepository } from '../../domain/repositories/appointment-repository.port';
import {
  AllAppointmentsFilter,
} from '../../presentation/controllers/appointment.dto';
import { AppointmentStatus } from '../../domain/entities/appointment.entity';

describe('AppointmentService - filters', () => {
  let service: AppointmentService;
  let repo: jest.Mocked<AppointmentRepository>;

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
    } as unknown as jest.Mocked<AppointmentRepository>;

    service = new AppointmentService(
      repo,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
  });

  describe('findAll - buildAllFilter', () => {
    it('ALL filter returns undefined (no filter)', async () => {
      repo.findAll.mockResolvedValue([]);
      await service.findAll(AllAppointmentsFilter.ALL);
      expect(repo.findAll).toHaveBeenCalledWith(undefined);
    });

    it('UPCOMING filter returns SCHEDULED + CONFIRMED with scheduledFrom', async () => {
      repo.findAll.mockResolvedValue([]);
      await service.findAll(AllAppointmentsFilter.UPCOMING);
      const filter = repo.findAll.mock.calls[0][0];
      expect(filter).toBeDefined();
      expect(filter!.statuses).toEqual(
        expect.arrayContaining([AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]),
      );
      expect(filter!.scheduledFrom).toBeInstanceOf(Date);
    });

    it('PENDING filter returns SCHEDULED without scheduledFrom', async () => {
      repo.findAll.mockResolvedValue([]);
      await service.findAll(AllAppointmentsFilter.PENDING);
      const filter = repo.findAll.mock.calls[0][0];
      expect(filter).toBeDefined();
      expect(filter!.statuses).toEqual([AppointmentStatus.SCHEDULED]);
      expect(filter!.scheduledFrom).toBeUndefined();
    });

    it('HISTORY filter returns COMPLETED + CANCELLED + NO_SHOW with scheduledTo', async () => {
      repo.findAll.mockResolvedValue([]);
      await service.findAll(AllAppointmentsFilter.HISTORY);
      const filter = repo.findAll.mock.calls[0][0];
      expect(filter).toBeDefined();
      expect(filter!.statuses).toEqual(
        expect.arrayContaining([
          AppointmentStatus.COMPLETED,
          AppointmentStatus.CANCELLED,
          AppointmentStatus.NO_SHOW,
        ]),
      );
      expect(filter!.scheduledTo).toBeInstanceOf(Date);
    });

    it('no filter returns undefined', async () => {
      repo.findAll.mockResolvedValue([]);
      await service.findAll();
      expect(repo.findAll).toHaveBeenCalledWith(undefined);
    });

    it('doctorId is passed when provided', async () => {
      repo.findAll.mockResolvedValue([]);
      await service.findAll(AllAppointmentsFilter.ALL, 'doctor-1');
      const filter = repo.findAll.mock.calls[0][0];
      expect(filter).toEqual({ doctorId: 'doctor-1' });
    });

    it('UPCOMING + doctorId combines both filters', async () => {
      repo.findAll.mockResolvedValue([]);
      await service.findAll(AllAppointmentsFilter.UPCOMING, 'doctor-1');
      const filter = repo.findAll.mock.calls[0][0];
      expect(filter!.statuses).toBeDefined();
      expect(filter!.scheduledFrom).toBeDefined();
      expect(filter!.doctorId).toBe('doctor-1');
    });
  });
});
