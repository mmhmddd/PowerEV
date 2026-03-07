import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { NavbarComponent } from "./shared/navbar/navbar.component";
import { FooterComponent } from "./shared/footer/footer.component";
import { ToastComponent } from "./shared/toast/toast.component";
import { LoaderComponent } from "./shared/loader/loader.component";
import { ThemeService } from "./core/services/theme.service";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent,
    FooterComponent,
    ToastComponent,
    LoaderComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'PowerEV';
  isAdminRoute = false;
  showLoader = false;
  private isBrowser: boolean;

  constructor(
    private router: Router,
    private themeService: ThemeService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    // Handle loader logic
    if (this.isBrowser) {
      console.log('Browser detected');
      const hasVisited = sessionStorage.getItem('hasVisited');
      console.log('Has visited:', hasVisited);

      if (!hasVisited) {
        console.log('First visit - showing loader');
        this.showLoader = true;
        sessionStorage.setItem('hasVisited', 'true');

        // Hide loader after 5 seconds
        setTimeout(() => {
          console.log('Hiding loader');
          this.showLoader = false;
        }, 5000);
      } else {
        console.log('Already visited - skipping loader');
        this.showLoader = false;
      }
    }

    // Check initial route
    this.checkRoute(this.router.url);

    // Listen to route changes
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe((event) => {
        this.checkRoute(event.urlAfterRedirects);
        // Scroll to top on route change
        if (this.isBrowser) {
          window.scrollTo(0, 0);
        }
      });
  }

  private checkRoute(url: string): void {
    this.isAdminRoute = url.startsWith('/admin');
  }
}
