import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { PlayerRoutingModule } from './player-routing.module';

// Note: Interceptors are now registered globally in main.ts
// No need to register here to avoid duplication

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    HttpClientModule,
    PlayerRoutingModule
  ],
  providers: []
})
export class PlayerModule {}


