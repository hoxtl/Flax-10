import { useState, useEffect } from "react";
import { KCL_DEPARTMENTS } from "../../lib/kclCourses";
import {
  requestCourseChange,
  getMyCourseChangeRequest,
} from "../../api/adminApi";
import styles from "../../pages/Settings/Settings.module.css";