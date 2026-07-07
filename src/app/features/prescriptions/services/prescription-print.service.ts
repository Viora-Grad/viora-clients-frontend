import { Injectable } from '@angular/core';
import { PrescriptionTemplate } from '../models/prescription-template.model';
import { Prescription } from '../models/prescription.model';

interface Margins {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

@Injectable({ providedIn: 'root' })
export class PrescriptionPrintService {
	/**
	 * Opens a print-ready window that lays the prescription text into the chosen
	 * template's margin box (margins are percentages of the media) and paginates
	 * onto multiple sheets when the content overflows a single page.
	 */
	public async print(
		prescription: Prescription,
		template: PrescriptionTemplate,
		patientName: string,
	): Promise<void> {
		if (!template.imageUrl) {
			throw new Error('Template image is not available.');
		}

		// Open synchronously so the browser treats it as a user-initiated popup.
		const printWindow = window.open('', '_blank', 'width=900,height=1000');
		if (!printWindow) {
			throw new Error('Unable to open the print window. Please allow pop-ups.');
		}
		printWindow.document.write(
			'<!doctype html><title>Prescription</title><body style="font-family:sans-serif;padding:24px;color:#555">Preparing prescription…</body>',
		);

		const { width, height } = await this._loadImageSize(template.imageUrl);
		const margins = this._parseMargins(template);
		const html = this._buildDocument(prescription, template.imageUrl, patientName, {
			width,
			height,
			margins,
		});

		printWindow.document.open();
		printWindow.document.write(html);
		printWindow.document.close();
	}

	private _loadImageSize(url: string): Promise<{ width: number; height: number }> {
		return new Promise((resolve, reject) => {
			const image = new Image();
			image.onload = (): void =>
				resolve({ width: image.naturalWidth || 1, height: image.naturalHeight || 1 });
			image.onerror = (): void => reject(new Error('Failed to load template image.'));
			image.src = url;
		});
	}

	private _parseMargins(template: PrescriptionTemplate): Margins {
		const clamp = (value: string): number => {
			const parsed = Number.parseFloat(value);
			if (Number.isNaN(parsed)) return 0;
			return Math.max(0, Math.min(100, parsed));
		};
		return {
			top: clamp(template.topMargin),
			right: clamp(template.rightMargin),
			bottom: clamp(template.bottomMargin),
			left: clamp(template.leftMargin),
		};
	}

	private _buildDocument(
		prescription: Prescription,
		imageUrl: string,
		patientName: string,
		layout: { width: number; height: number; margins: Margins },
	): string {
		const { width, height, margins } = layout;
		// Match the printed sheet to the media aspect ratio so the previewed
		// margins map exactly onto the page.
		const pageWidthMm = 210;
		const pageHeightMm = Math.round((pageWidthMm * height) / width);

		const issued = this._formatDate(prescription.createAt);

		const header = `
			<div class="rx-header">
				<div><span class="rx-label">Patient:</span> ${this._escape(patientName)}</div>
				<div><span class="rx-label">Date:</span> ${this._escape(issued)}</div>
			</div>`;

		const items = prescription.items
			.map((item, index) => {
				const freq = item.frequence?.toString().trim();
				const duration = item.duration?.toString().trim();
				const note = item.note?.toString().trim();
				return `
					<div class="rx-item">
						<div class="rx-name">${index + 1}. ${this._escape(item.name)}</div>
						<div class="rx-meta">
							<span><span class="rx-label">Dose:</span> ${this._escape(item.dose || '—')}</span>
							<span><span class="rx-label">Frequency:</span> ${freq ? `${this._escape(freq)} / day` : '—'}</span>
							<span><span class="rx-label">Duration:</span> ${duration ? `${this._escape(duration)} days` : '—'}</span>
						</div>
						${note ? `<div class="rx-note"><span class="rx-label">Note:</span> ${this._escape(note)}</div>` : ''}
					</div>`;
			})
			.join('');

		return `<!doctype html>
<html>
<head>
	<meta charset="utf-8" />
	<title>Prescription</title>
	<style>
		@page { size: ${pageWidthMm}mm ${pageHeightMm}mm; margin: 0; }
		* { box-sizing: border-box; }
		html, body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
		#src { display: none; }
		.page {
			position: relative;
			width: ${pageWidthMm}mm;
			height: ${pageHeightMm}mm;
			overflow: hidden;
			page-break-after: always;
			background: #fff;
		}
		.page:last-child { page-break-after: auto; }
		.bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: fill; }
		.textbox {
			position: absolute;
			top: ${margins.top}%;
			left: ${margins.left}%;
			right: ${margins.right}%;
			bottom: ${margins.bottom}%;
			overflow: hidden;
			font-family: 'Segoe UI', Arial, sans-serif;
			color: #1a1a1a;
		}
		.rx-header {
			display: flex;
			justify-content: space-between;
			gap: 12px;
			font-size: 11pt;
			padding-bottom: 6pt;
			margin-bottom: 8pt;
			border-bottom: 1px solid rgba(0,0,0,0.25);
		}
		.rx-item { padding: 6pt 0; border-bottom: 1px solid rgba(0,0,0,0.08); }
		.rx-name { font-size: 12pt; font-weight: 700; margin-bottom: 3pt; }
		.rx-meta { display: flex; flex-wrap: wrap; gap: 4pt 18pt; font-size: 10pt; }
		.rx-note { font-size: 9.5pt; margin-top: 3pt; color: #444; }
		.rx-label { color: #666; font-weight: 600; }
	</style>
</head>
<body>
	<div id="src">${header}${items}</div>
	<div id="pages"></div>
	<script>
		(function () {
			var IMG = ${JSON.stringify(imageUrl)};
			function newPage() {
				var page = document.createElement('div');
				page.className = 'page';
				var img = document.createElement('img');
				img.className = 'bg';
				img.src = IMG;
				var box = document.createElement('div');
				box.className = 'textbox';
				page.appendChild(img);
				page.appendChild(box);
				document.getElementById('pages').appendChild(page);
				return box;
			}
			function paginate() {
				var src = document.getElementById('src');
				var nodes = Array.prototype.slice.call(src.children);
				var box = newPage();
				nodes.forEach(function (node) {
					box.appendChild(node);
					if (box.scrollHeight > box.clientHeight && box.children.length > 1) {
						box.removeChild(node);
						box = newPage();
						box.appendChild(node);
					}
				});
				src.parentNode.removeChild(src);
			}
			function doPrint() {
				window.focus();
				window.print();
			}
			function whenImagesReady() {
				var imgs = document.images;
				var pending = imgs.length;
				if (!pending) { doPrint(); return; }
				function done() { if (--pending === 0) doPrint(); }
				for (var i = 0; i < imgs.length; i++) {
					if (imgs[i].complete) { done(); }
					else {
						imgs[i].addEventListener('load', done);
						imgs[i].addEventListener('error', done);
					}
				}
			}
			function ready() { paginate(); whenImagesReady(); }
			if (document.readyState === 'complete') { ready(); }
			else { window.addEventListener('load', ready); }
		})();
	</script>
</body>
</html>`;
	}

	private _formatDate(dateStr: string): string {
		if (!dateStr) return '—';
		const date = new Date(dateStr);
		if (Number.isNaN(date.getTime())) return '—';
		return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
	}

	private _escape(value: string): string {
		return value
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}
}
