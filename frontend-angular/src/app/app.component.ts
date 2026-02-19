import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { ToastComponent } from './shared/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastComponent],
  template: `
    <app-toast />
    <div class="app-shell">
      @if (auth.isLoggedIn()) {
        <nav class="navbar">
          <div class="navbar-container">
            <!-- Logo/Brand -->
            <div class="navbar-brand">
              <a routerLink="/dashboard" class="brand-link">
                <span class="brand-icon">🏦</span>
                <span class="brand-text">BankApp</span>
              </a>
            </div>

            <!-- Desktop Navigation -->
            <div class="navbar-nav">
              <a routerLink="/dashboard" routerLinkActive="active" class="nav-link">
                <span>Dashboard</span>
              </a>
              <a routerLink="/accounts" routerLinkActive="active" class="nav-link">
                <span>Accounts</span>
              </a>
              <a routerLink="/loans" routerLinkActive="active" class="nav-link">
                <span>Loans</span>
              </a>
              <a routerLink="/plans" routerLinkActive="active" class="nav-link">
                <span>Plans</span>
              </a>
              <a routerLink="/reports" routerLinkActive="active" class="nav-link">
                <span>Reports</span>
              </a>
            </div>

            <!-- User Menu -->
            <div class="navbar-user">
              <div class="user-menu" (click)="toggleUserMenu()">
                <div class="user-avatar">
                  {{ getUserInitials() }}
                </div>
                <div class="user-info">
                  <div class="user-name">{{ getUserDisplayName() }}</div>
                  <div class="user-role">{{ auth.role() }}</div>
                </div>
                <span class="user-menu-icon">{{ showUserMenu() ? '▲' : '▼' }}</span>
              </div>
              @if (showUserMenu()) {
                <div class="user-dropdown">
                  <div class="dropdown-header">
                    <div class="dropdown-email">{{ auth.user()?.email }}</div>
                    <div class="dropdown-role">{{ auth.role() }}</div>
                  </div>
                  <div class="dropdown-divider"></div>
                  <a routerLink="/change-password" class="dropdown-item" (click)="closeUserMenu()">
                    <span>Change Password</span>
                  </a>
                  <div class="dropdown-divider"></div>
                  <button type="button" class="dropdown-item dropdown-item-danger" (click)="logout()">
                    <span>Logout</span>
                  </button>
                </div>
              }
            </div>

            <!-- Mobile Menu Toggle -->
            <button type="button" class="mobile-menu-toggle" (click)="toggleMobileMenu()" aria-label="Toggle menu">
              <span class="hamburger" [class.active]="showMobileMenu()">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
          </div>

          <!-- Mobile Navigation -->
          @if (showMobileMenu()) {
            <div class="mobile-nav">
              <a routerLink="/dashboard" routerLinkActive="active" class="mobile-nav-link" (click)="closeMobileMenu()">
                <span>Dashboard</span>
              </a>
              <a routerLink="/accounts" routerLinkActive="active" class="mobile-nav-link" (click)="closeMobileMenu()">
                <span>Accounts</span>
              </a>
              <a routerLink="/loans" routerLinkActive="active" class="mobile-nav-link" (click)="closeMobileMenu()">
                <span>Loans</span>
              </a>
              <a routerLink="/plans" routerLinkActive="active" class="mobile-nav-link" (click)="closeMobileMenu()">
                <span>Plans</span>
              </a>
              <a routerLink="/reports" routerLinkActive="active" class="mobile-nav-link" (click)="closeMobileMenu()">
                <span>Reports</span>
              </a>
              <div class="mobile-nav-divider"></div>
              <a routerLink="/change-password" class="mobile-nav-link" (click)="closeMobileMenu()">
                <span>Change Password</span>
              </a>
              <button type="button" class="mobile-nav-link mobile-nav-link-danger" (click)="logout()">
                <span>Logout</span>
              </button>
            </div>
          }
        </nav>
      }
      <main class="main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .app-shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: #f9fafb;
    }

    /* Navbar */
    .navbar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    .navbar-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 64px;
      gap: 2rem;
    }

    /* Brand */
    .navbar-brand {
      flex-shrink: 0;
    }

    .brand-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      color: white;
      font-weight: 700;
      font-size: 1.25rem;
      transition: opacity 0.2s;
    }

    .brand-link:hover {
      opacity: 0.9;
    }

    .brand-icon {
      font-size: 1.5rem;
    }

    .brand-text {
      display: none;
    }

    @media (min-width: 640px) {
      .brand-text {
        display: inline;
      }
    }

    /* Desktop Navigation */
    .navbar-nav {
      display: none;
      align-items: center;
      gap: 0.5rem;
      flex: 1;
    }

    @media (min-width: 768px) {
      .navbar-nav {
        display: flex;
      }
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      color: rgba(255, 255, 255, 0.9);
      text-decoration: none;
      font-weight: 500;
      font-size: 0.9375rem;
      border-radius: 0.5rem;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .nav-link:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }

    .nav-link.active {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      font-weight: 600;
    }

    .nav-icon {
      font-size: 1rem;
    }

    /* User Menu */
    .navbar-user {
      position: relative;
      flex-shrink: 0;
    }

    .user-menu {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0.75rem;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 0.5rem;
      cursor: pointer;
      transition: background 0.2s;
      user-select: none;
    }

    .user-menu:hover {
      background: rgba(255, 255, 255, 0.25);
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.875rem;
      color: white;
      flex-shrink: 0;
    }

    .user-info {
      display: none;
      flex-direction: column;
      gap: 0.125rem;
    }

    @media (min-width: 640px) {
      .user-info {
        display: flex;
      }
    }

    .user-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: white;
      line-height: 1.2;
    }

    .user-role {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.8);
      text-transform: uppercase;
      line-height: 1.2;
    }

    .user-menu-icon {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.9);
      transition: transform 0.2s;
    }

    /* User Dropdown */
    .user-dropdown {
      position: absolute;
      top: calc(100% + 0.5rem);
      right: 0;
      min-width: 240px;
      background: white;
      border-radius: 0.75rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      z-index: 1001;
      animation: slideDown 0.2s ease-out;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .dropdown-header {
      padding: 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .dropdown-email {
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .dropdown-role {
      font-size: 0.75rem;
      opacity: 0.9;
      text-transform: uppercase;
    }

    .dropdown-divider {
      height: 1px;
      background: #e5e7eb;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.75rem 1rem;
      background: none;
      border: none;
      text-align: left;
      font-size: 0.875rem;
      color: #374151;
      cursor: pointer;
      transition: background 0.2s;
      text-decoration: none;
    }

    .dropdown-item:hover {
      background: #f3f4f6;
    }

    .dropdown-item-danger {
      color: #dc2626;
    }

    .dropdown-item-danger:hover {
      background: #fee2e2;
    }

    .dropdown-icon {
      font-size: 1rem;
      width: 1.25rem;
      text-align: center;
    }

    /* Mobile Menu Toggle */
    .mobile-menu-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.15);
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: background 0.2s;
    }

    @media (min-width: 768px) {
      .mobile-menu-toggle {
        display: none;
      }
    }

    .mobile-menu-toggle:hover {
      background: rgba(255, 255, 255, 0.25);
    }

    .hamburger {
      display: flex;
      flex-direction: column;
      gap: 4px;
      width: 20px;
    }

    .hamburger span {
      display: block;
      width: 100%;
      height: 2px;
      background: white;
      border-radius: 2px;
      transition: all 0.3s;
    }

    .hamburger.active span:nth-child(1) {
      transform: rotate(45deg) translate(5px, 5px);
    }

    .hamburger.active span:nth-child(2) {
      opacity: 0;
    }

    .hamburger.active span:nth-child(3) {
      transform: rotate(-45deg) translate(7px, -6px);
    }

    /* Mobile Navigation */
    .mobile-nav {
      display: flex;
      flex-direction: column;
      padding: 0.5rem 0;
      background: rgba(255, 255, 255, 0.05);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    @media (min-width: 768px) {
      .mobile-nav {
        display: none;
      }
    }

    .mobile-nav-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1.5rem;
      color: rgba(255, 255, 255, 0.95);
      text-decoration: none;
      font-weight: 500;
      transition: background 0.2s;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
      cursor: pointer;
      font-size: 0.9375rem;
    }

    .mobile-nav-link:hover,
    .mobile-nav-link.active {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }

    .mobile-nav-link-danger {
      color: #fee2e2;
    }

    .mobile-nav-link-danger:hover {
      background: rgba(220, 38, 38, 0.2);
    }

    .mobile-nav-divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
      margin: 0.5rem 1.5rem;
    }

    /* Main Content */
    .main {
      flex: 1;
      padding: 2rem 1rem;
    }

    @media (min-width: 768px) {
      .main {
        padding: 2rem 1.5rem;
      }
    }
  `],
})
export class AppComponent {
  showUserMenu = signal(false);
  showMobileMenu = signal(false);

  constructor(public auth: AuthService) {}

  toggleUserMenu(): void {
    this.showUserMenu.update(v => !v);
  }

  closeUserMenu(): void {
    this.showUserMenu.set(false);
  }

  toggleMobileMenu(): void {
    this.showMobileMenu.update(v => !v);
  }

  closeMobileMenu(): void {
    this.showMobileMenu.set(false);
  }

  getUserInitials(): string {
    const user = this.auth.user();
    if (!user) return '?';
    const first = user.firstName?.[0]?.toUpperCase() || '';
    const last = user.lastName?.[0]?.toUpperCase() || '';
    if (first && last) return first + last;
    if (first) return first;
    return user.email?.[0]?.toUpperCase() || '?';
  }

  getUserDisplayName(): string {
    const user = this.auth.user();
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    return user?.email?.split('@')[0] || 'User';
  }

  logout(): void {
    this.closeUserMenu();
    this.closeMobileMenu();
    this.auth.logout().subscribe({
      next: () => {
        this.auth.clearSession();
        window.location.href = '/login';
      },
      error: () => {
        this.auth.clearSession();
        window.location.href = '/login';
      },
    });
  }
}
