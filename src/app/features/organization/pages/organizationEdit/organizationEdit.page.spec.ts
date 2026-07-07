import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationEditPage } from './organizationEdit.page';

describe('OrganizationEditPage', () => {
	let component: OrganizationEditPage;
	let fixture: ComponentFixture<OrganizationEditPage>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [OrganizationEditPage],
		}).compileComponents();

		fixture = TestBed.createComponent(OrganizationEditPage);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
