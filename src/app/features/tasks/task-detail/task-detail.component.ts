import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-task-detail',
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4">Task Details</h1>
      <p>View task details here!</p>
    </div>
  `,
  styles: []
})
export class TaskDetailComponent {}
