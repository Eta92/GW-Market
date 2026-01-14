import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@NgModule({
  exports: [FormsModule, ReactiveFormsModule, CommonModule]
})
export class SharedModule {}
