import { Component } from "@angular/core";
import { injectWebHaptics } from "web-haptics/angular";

@Component({
  selector: "app-root",
  standalone: true,
  template: `
    <div class="container">
      <button (click)="haptics.trigger()">Tap me</button>
    </div>
  `,
  styles: `
    .container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      font-size: 2rem;
    }
  `,
})
export class AppComponent {
  haptics = injectWebHaptics();
}
