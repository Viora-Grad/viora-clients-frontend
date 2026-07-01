import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthStore } from './core/auth/stores/auth.store';
import { LoginPage } from './features/authentication/pages/login/login.page';

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-root',
	imports: [RouterOutlet, LoginPage],
	templateUrl: './app.component.html',
	styleUrl: './app.component.css',
})
export class AppComponent {
	protected readonly authStore = inject(AuthStore);
}
