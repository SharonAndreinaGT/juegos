import { Component, input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-grade-students',
  templateUrl: './grade-students.component.html',
  styleUrl: './grade-students.component.css'
})

export class GradeStudentsComponent implements OnInit {
  gradeTitle: string = '';
  students: any[] = [];

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.data.subscribe((data) => {
      this.gradeTitle = data['gradeTitle'];
      this.students = data['students'];
    });
  }

}
