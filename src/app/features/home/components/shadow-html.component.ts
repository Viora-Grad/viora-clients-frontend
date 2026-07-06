import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	inject,
	input,
	OnChanges,
	viewChild,
} from '@angular/core';

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-shadow-html',
	template: `<div #host></div>`,
	styles: `:host { display: block; width: 100%; }`,
})
export class ShadowHtmlComponent implements OnChanges {
	readonly html = input.required<string>();

	private readonly _host = viewChild<ElementRef<HTMLDivElement>>('host');
	private _shadowRoot: ShadowRoot | null = null;

	public ngOnChanges(): void {
		const hostEl = this._host()?.nativeElement;
		if (!hostEl) return;

		if (!this._shadowRoot) {
			this._shadowRoot = hostEl.attachShadow({ mode: 'open' });
		}

		const raw = this.html();
		const styles = this._extractStyles(raw);
		const body = this._extractBody(raw);

		const scopedStyles = styles
			.replace(/:root/g, '.analytics-root')
			.replace(/\bbody\s*\{/g, '.analytics-root {');

		const wrapper = document.createElement('div');
		wrapper.innerHTML = `<style>${scopedStyles}</style><div class="analytics-root">${body}</div>`;
		this._shadowRoot.innerHTML = '';
		this._shadowRoot.appendChild(wrapper);
	}

	private _extractStyles(html: string): string {
		const matches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
		if (!matches) return '';
		return matches
			.map((m) => {
				const inner = m.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
				return inner ? inner[1] : '';
			})
			.join('\n');
	}

	private _extractBody(html: string): string {
		const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
		return bodyMatch ? bodyMatch[1] : html;
	}
}
