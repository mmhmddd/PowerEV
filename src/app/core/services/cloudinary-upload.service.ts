

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class CloudinaryUploadService {

  // ── Replace these two values with your Cloudinary details ────────────────
  private readonly CLOUD_NAME   = 'dqfd8qcrs';           // your cloud name
  private readonly UPLOAD_PRESET = 'powerev_payments';   // unsigned preset you'll create
  // ─────────────────────────────────────────────────────────────────────────

  private readonly UPLOAD_URL =
    `https://api.cloudinary.com/v1_1/${this.CLOUD_NAME}/image/upload`;

  constructor(private http: HttpClient) {}

  /**
   * Upload a base64 image directly to Cloudinary from the browser.
   * Returns the secure_url of the uploaded image.
   */
  uploadPaymentScreenshot(base64Image: string): Observable<string> {
    const formData = new FormData();
    formData.append('file',           base64Image);
    formData.append('upload_preset',  this.UPLOAD_PRESET);
    formData.append('folder',         'powerev/payment-screenshots');

    return this.http
      .post<{ secure_url: string }>(this.UPLOAD_URL, formData)
      .pipe(map(response => response.secure_url));
  }
}
