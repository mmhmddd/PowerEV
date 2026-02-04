import { Component } from '@angular/core';
import { HeroSectionComponent } from '../../shared/hero-section/hero-section.component';
import { SliderComponent } from "../../shared/slider/slider.component";
import { ProductsSectionComponent } from "../../shared/products-section/products-section.component";
import { LatestProductsSliderComponent } from "../../shared/lates-products-slider/lates-products-slider.component";
import { WhyChooseUsComponent } from "../../shared/why-choose-us/why-choose-us.component";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeroSectionComponent, SliderComponent, ProductsSectionComponent, LatestProductsSliderComponent, WhyChooseUsComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

}
