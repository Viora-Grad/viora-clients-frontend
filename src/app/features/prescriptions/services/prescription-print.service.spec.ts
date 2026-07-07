import { TestBed } from '@angular/core/testing';
import { PrescriptionPrintService } from './prescription-print.service';
import { Prescription } from '../models/prescription.model';
import { PrescriptionTemplate } from '../models/prescription-template.model';

describe('PrescriptionPrintService', () => {
	let service: PrescriptionPrintService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(PrescriptionPrintService);
	});

	const mockPrescription: Prescription = {
		id: 'rx-1',
		appointmentId: 'apt-1',
		createAt: '2025-03-15T10:30:00Z',
		items: [
			{ name: 'Amoxicillin', dose: '500mg', frequence: '3', duration: '7', note: 'Take with food' },
			{ name: 'Ibuprofen', dose: '200mg', frequence: '2', duration: '5', note: null },
		],
	};

	const mockTemplate: PrescriptionTemplate = {
		id: 'tpl-1',
		organizationId: 'org-1',
		media: null,
		name: 'Default',
		topMargin: '15',
		rightMargin: '10',
		leftMargin: '10',
		bottomMargin: '10',
		imageUrl: 'data:image/png;base64,abc',
	};

	describe('print', () => {
		it('should throw when template has no imageUrl', async () => {
			const template = { ...mockTemplate, imageUrl: null };

			await expect(service.print(mockPrescription, template, 'John Doe'))
				.rejects.toThrow('Template image is not available.');
		});
	});

	describe('_formatDate (via print flow)', () => {
		it('should format valid dates correctly', () => {
			const svc = service as unknown as { _formatDate(s: string): string };
			const result = svc._formatDate('2025-03-15T10:30:00Z');
			expect(result).toContain('15');
			expect(result).toContain('2025');
		});

		it('should return "—" for empty string', () => {
			const svc = service as unknown as { _formatDate(s: string): string };
			const result = svc._formatDate('');
			expect(result).toBe('—');
		});

		it('should return "—" for invalid date', () => {
			const svc = service as unknown as { _formatDate(s: string): string };
			const result = svc._formatDate('not-a-date');
			expect(result).toBe('—');
		});
	});

	describe('_escape (via print flow)', () => {
		it('should escape HTML special characters', () => {
			const svc = service as unknown as { _escape(s: string): string };
			expect(svc._escape('a & b')).toBe('a &amp; b');
			expect(svc._escape('<script>')).toBe('&lt;script&gt;');
			expect(svc._escape('"hello"')).toBe('&quot;hello&quot;');
			expect(svc._escape("it's")).toBe('it&#39;s');
		});

		it('should not modify clean strings', () => {
			const svc = service as unknown as { _escape(s: string): string };
			expect(svc._escape('Amoxicillin 500mg')).toBe('Amoxicillin 500mg');
		});
	});

	describe('_parseMargins (via print flow)', () => {
		it('should parse valid margin values', () => {
			const svc = service as unknown as {
				_parseMargins(t: PrescriptionTemplate): { top: number; right: number; bottom: number; left: number };
			};
			const result = svc._parseMargins(mockTemplate);
			expect(result).toEqual({ top: 15, right: 10, bottom: 10, left: 10 });
		});

		it('should clamp values above 100 to 100', () => {
			const svc = service as unknown as {
				_parseMargins(t: PrescriptionTemplate): { top: number; right: number; bottom: number; left: number };
			};
			const template = { ...mockTemplate, topMargin: '150' };
			expect(svc._parseMargins(template).top).toBe(100);
		});

		it('should clamp negative values to 0', () => {
			const svc = service as unknown as {
				_parseMargins(t: PrescriptionTemplate): { top: number; right: number; bottom: number; left: number };
			};
			const template = { ...mockTemplate, topMargin: '-10' };
			expect(svc._parseMargins(template).top).toBe(0);
		});

		it('should return 0 for NaN values', () => {
			const svc = service as unknown as {
				_parseMargins(t: PrescriptionTemplate): { top: number; right: number; bottom: number; left: number };
			};
			const template = { ...mockTemplate, topMargin: 'abc' };
			expect(svc._parseMargins(template).top).toBe(0);
		});

		it('should return 0 for empty string', () => {
			const svc = service as unknown as {
				_parseMargins(t: PrescriptionTemplate): { top: number; right: number; bottom: number; left: number };
			};
			const template = { ...mockTemplate, topMargin: '' };
			expect(svc._parseMargins(template).top).toBe(0);
		});
	});
});
