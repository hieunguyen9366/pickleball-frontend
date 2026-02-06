import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, firstValueFrom } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ApiResponse, ApiRequestOptions, PaginatedResponse } from 'src/app/common/models/api-response.model';
import { ToastService } from './services/toast.service';

/**
 * Base API Service
 * Cung cấp các phương thức cơ bản để gọi API
 */
@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private http = inject(HttpClient);
    private toastService = inject(ToastService);
    private readonly apiUrl = environment.apiUrl;
    private showErrorToasts = true; // Flag to control error toast display

    /**
     * GET request
     */
    get<T = any>(endpoint: string, options?: ApiRequestOptions): Observable<T> {
        const url = this.buildUrl(endpoint);
        const params = this.buildParams(options?.params);
        const headers = this.buildHeaders(options?.headers);

        const httpOptions: any = {
            params,
            headers
        };

        // Only add optional properties if they exist
        if (options?.reportProgress !== undefined) {
            httpOptions.reportProgress = options.reportProgress;
        }
        // Only set observe if it's explicitly 'body', otherwise use default
        if (options?.observe === 'body') {
            httpOptions.observe = 'body';
        }
        if (options?.responseType !== undefined && options.responseType !== 'json') {
            httpOptions.responseType = options.responseType;
        }

        const observable = this.http.get<ApiResponse<T> | T>(url, httpOptions);

        // If reportProgress is enabled or observe is 'events', don't use map
        if (options?.reportProgress || options?.observe === 'events') {
            return observable.pipe(
                catchError((error) => this.handleError(error))
            ) as Observable<T>;
        }

        return observable.pipe(
            map((response) => this.extractData<T>(response)),
            catchError((error) => this.handleError(error))
        );
    }

    /**
     * POST request
     */
    post<T = any>(endpoint: string, body: any, options?: ApiRequestOptions): Observable<T> {
        const url = this.buildUrl(endpoint);
        const params = this.buildParams(options?.params);
        const headers = this.buildHeaders(options?.headers);

        const httpOptions: any = {
            params,
            headers
        };

        // Only add optional properties if they exist
        if (options?.reportProgress !== undefined) {
            httpOptions.reportProgress = options.reportProgress;
        }
        // Only set observe if it's explicitly 'body', otherwise use default
        if (options?.observe === 'body') {
            httpOptions.observe = 'body';
        }
        if (options?.responseType !== undefined && options.responseType !== 'json') {
            httpOptions.responseType = options.responseType;
        }

        const observable = this.http.post<ApiResponse<T> | T>(url, body, httpOptions);

        // If reportProgress is enabled or observe is 'events', don't use map
        if (options?.reportProgress || options?.observe === 'events') {
            return observable.pipe(
                catchError((error) => this.handleError(error))
            ) as Observable<T>;
        }

        return observable.pipe(
            map((response) => this.extractData<T>(response)),
            catchError((error) => this.handleError(error))
        );
    }

    /**
     * PUT request
     */
    put<T = any>(endpoint: string, body: any, options?: ApiRequestOptions): Observable<T> {
        const url = this.buildUrl(endpoint);
        const params = this.buildParams(options?.params);
        const headers = this.buildHeaders(options?.headers);

        const httpOptions: any = {
            params,
            headers
        };

        // Only add optional properties if they exist
        if (options?.reportProgress !== undefined) {
            httpOptions.reportProgress = options.reportProgress;
        }
        // Only set observe if it's explicitly 'body', otherwise use default
        if (options?.observe === 'body') {
            httpOptions.observe = 'body';
        }
        if (options?.responseType !== undefined && options.responseType !== 'json') {
            httpOptions.responseType = options.responseType;
        }

        const observable = this.http.put<ApiResponse<T> | T>(url, body, httpOptions);

        // If reportProgress is enabled or observe is 'events', don't use map
        if (options?.reportProgress || options?.observe === 'events') {
            return observable.pipe(
                catchError((error) => this.handleError(error))
            ) as Observable<T>;
        }

        return observable.pipe(
            map((response) => this.extractData<T>(response)),
            catchError((error) => this.handleError(error))
        );
    }

    /**
     * PATCH request
     */
    patch<T = any>(endpoint: string, body: any, options?: ApiRequestOptions): Observable<T> {
        const url = this.buildUrl(endpoint);
        const params = this.buildParams(options?.params);
        const headers = this.buildHeaders(options?.headers);

        const httpOptions: any = {
            params,
            headers
        };

        // Only add optional properties if they exist
        if (options?.reportProgress !== undefined) {
            httpOptions.reportProgress = options.reportProgress;
        }
        // Only set observe if it's explicitly 'body', otherwise use default
        if (options?.observe === 'body') {
            httpOptions.observe = 'body';
        }
        if (options?.responseType !== undefined && options.responseType !== 'json') {
            httpOptions.responseType = options.responseType;
        }

        const observable = this.http.patch<ApiResponse<T> | T>(url, body, httpOptions);

        // If reportProgress is enabled or observe is 'events', don't use map
        if (options?.reportProgress || options?.observe === 'events') {
            return observable.pipe(
                catchError((error) => this.handleError(error))
            ) as Observable<T>;
        }

        return observable.pipe(
            map((response) => this.extractData<T>(response)),
            catchError((error) => this.handleError(error))
        );
    }

    /**
     * DELETE request
     */
    delete<T = any>(endpoint: string, options?: ApiRequestOptions): Observable<T> {
        const url = this.buildUrl(endpoint);
        const params = this.buildParams(options?.params);
        const headers = this.buildHeaders(options?.headers);

        const httpOptions: any = {
            params,
            headers
        };

        // Only add optional properties if they exist
        if (options?.reportProgress !== undefined) {
            httpOptions.reportProgress = options.reportProgress;
        }
        // Only set observe if it's explicitly 'body', otherwise use default
        if (options?.observe === 'body') {
            httpOptions.observe = 'body';
        }
        if (options?.responseType !== undefined && options.responseType !== 'json') {
            httpOptions.responseType = options.responseType;
        }

        const observable = this.http.delete<ApiResponse<T> | T>(url, httpOptions);

        // If reportProgress is enabled or observe is 'events', don't use map
        if (options?.reportProgress || options?.observe === 'events') {
            return observable.pipe(
                catchError((error) => this.handleError(error))
            ) as Observable<T>;
        }

        return observable.pipe(
            map((response) => this.extractData<T>(response)),
            catchError((error) => this.handleError(error))
        );
    }

    /**
     * GET request với pagination
     */
    getPaginated<T = any>(endpoint: string, page: number = 0, size: number = 10, options?: ApiRequestOptions): Observable<PaginatedResponse<T>> {
        const params = {
            page: page.toString(),
            size: size.toString(),
            ...options?.params
        };

        return this.get<PaginatedResponse<T>>(endpoint, { ...options, params });
    }

    /**
     * Upload file
     */
    uploadFile<T = any>(endpoint: string, file: File, options?: ApiRequestOptions): Observable<T> {
        const url = this.buildUrl(endpoint);
        const formData = new FormData();
        formData.append('file', file);

        const headers = this.buildHeaders(options?.headers, false); // Don't set Content-Type for FormData

        const httpOptions: any = {
            headers
        };

        // Only add optional properties if they exist
        if (options?.reportProgress !== undefined) {
            httpOptions.reportProgress = options.reportProgress;
        }
        // Only set observe if it's explicitly 'body', otherwise use default
        if (options?.observe === 'body') {
            httpOptions.observe = 'body';
        }

        const observable = this.http.post<ApiResponse<T> | T>(url, formData, httpOptions);

        // If reportProgress is enabled or observe is 'events', don't use map
        if (options?.reportProgress || options?.observe === 'events') {
            return observable.pipe(
                catchError((error) => this.handleError(error))
            ) as Observable<T>;
        }

        return observable.pipe(
            map((response) => this.extractData<T>(response)),
            catchError((error) => this.handleError(error))
        );
    }

    /**
     * Upload multiple files
     */
    uploadFiles<T = any>(endpoint: string, files: File[], options?: ApiRequestOptions): Observable<T> {
        const url = this.buildUrl(endpoint);
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        const headers = this.buildHeaders(options?.headers, false); // Don't set Content-Type for FormData

        const httpOptions: any = {
            headers
        };

        // Only add optional properties if they exist
        if (options?.reportProgress !== undefined) {
            httpOptions.reportProgress = options.reportProgress;
        }

        const observable = this.http.post<ApiResponse<T> | T>(url, formData, httpOptions);

        return observable.pipe(
            map((response) => this.extractData<T>(response)),
            catchError((error) => this.handleError(error))
        );
    }

    /**
     * Download file
     */
    downloadFile(endpoint: string, options?: ApiRequestOptions): Observable<Blob> {
        const url = this.buildUrl(endpoint);
        const params = this.buildParams(options?.params);
        const headers = this.buildHeaders(options?.headers);

        return this.http.get(url, {
            params,
            headers,
            responseType: 'blob' as 'json'
        } as any).pipe(
            catchError((error) => this.handleError(error))
        ) as unknown as Observable<Blob>;
    }

    // ============================================
    // ASYNC/AWAIT METHODS - Sử dụng với async/await
    // ============================================

    /**
     * GET request với async/await
     */
    async getAsync<T = any>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
        return firstValueFrom(this.get<T>(endpoint, options));
    }

    /**
     * POST request với async/await
     */
    async postAsync<T = any>(endpoint: string, body: any, options?: ApiRequestOptions): Promise<T> {
        return firstValueFrom(this.post<T>(endpoint, body, options));
    }

    /**
     * PUT request với async/await
     */
    async putAsync<T = any>(endpoint: string, body: any, options?: ApiRequestOptions): Promise<T> {
        return firstValueFrom(this.put<T>(endpoint, body, options));
    }

    /**
     * PATCH request với async/await
     */
    async patchAsync<T = any>(endpoint: string, body: any, options?: ApiRequestOptions): Promise<T> {
        return firstValueFrom(this.patch<T>(endpoint, body, options));
    }

    /**
     * DELETE request với async/await
     */
    async deleteAsync<T = any>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
        return firstValueFrom(this.delete<T>(endpoint, options));
    }

    /**
     * GET request với pagination và async/await
     */
    async getPaginatedAsync<T = any>(endpoint: string, page: number = 0, size: number = 10, options?: ApiRequestOptions): Promise<PaginatedResponse<T>> {
        return firstValueFrom(this.getPaginated<T>(endpoint, page, size, options));
    }

    /**
     * Upload file với async/await
     */
    async uploadFileAsync<T = any>(endpoint: string, file: File, options?: ApiRequestOptions): Promise<T> {
        return firstValueFrom(this.uploadFile<T>(endpoint, file, options));
    }

    /**
     * Download file với async/await
     */
    async downloadFileAsync(endpoint: string, options?: ApiRequestOptions): Promise<Blob> {
        return firstValueFrom(this.downloadFile(endpoint, options));
    }

    /**
     * Build full URL
     */
    private buildUrl(endpoint: string): string {
        // Remove leading slash if present to avoid double slashes
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
        return `${this.apiUrl}/${cleanEndpoint}`;
    }

    /**
     * Build HTTP params
     */
    private buildParams(params?: any): HttpParams | undefined {
        if (!params || Object.keys(params).length === 0) {
            return undefined;
        }

        let httpParams = new HttpParams();
        let hasParams = false;

        Object.keys(params).forEach((key) => {
            if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                hasParams = true;
                if (Array.isArray(params[key])) {
                    params[key].forEach((value: any) => {
                        httpParams = httpParams.append(key, value.toString());
                    });
                } else {
                    httpParams = httpParams.set(key, params[key].toString());
                }
            }
        });

        return hasParams ? httpParams : undefined;
    }

    /**
     * Build HTTP headers
     */
    private buildHeaders(customHeaders?: { [key: string]: string }, includeContentType: boolean = true): HttpHeaders {
        let headers = new HttpHeaders();

        if (includeContentType) {
            headers = headers.set('Content-Type', 'application/json');
        }

        // Add custom headers
        if (customHeaders) {
            Object.keys(customHeaders).forEach((key) => {
                headers = headers.set(key, customHeaders[key]);
            });
        }

        return headers;
    }

    /**
     * Extract data from API response
     */
    private extractData<T>(response: any): T {
        // Handle Blob or ArrayBuffer (for file downloads)
        if (response instanceof Blob || response instanceof ArrayBuffer) {
            return response as unknown as T;
        }

        // Handle string response
        if (typeof response === 'string') {
            return response as unknown as T;
        }

        // If response is already in ApiResponse format
        if (response && typeof response === 'object' && 'success' in response) {
            const apiResponse = response as ApiResponse<T>;
            if (apiResponse.success && apiResponse.data !== undefined) {
                return apiResponse.data;
            }
            // If success is false, throw error with message
            if (!apiResponse.success) {
                throw new Error(apiResponse.message || 'API request failed');
            }
        }
        // If response is directly the data
        return response as T;
    }

    /**
     * Handle HTTP errors
     * Giữ nguyên HttpErrorResponse để interceptors có thể xử lý status code
     */
    private handleError(error: HttpErrorResponse): Observable<never> {
        // Không transform error thành Error object mới
        // Giữ nguyên HttpErrorResponse để interceptors có thể xử lý status code (401, 403, etc.)
        // ErrorInterceptor và AuthInterceptor sẽ xử lý error message và status code
        return throwError(() => error);
    }

    /**
     * Enable/disable automatic error toast display
     */
    setErrorToastEnabled(enabled: boolean): void {
        this.showErrorToasts = enabled;
    }

    /**
     * Extract error message from API response
     * Ưu tiên các format phổ biến của API
     * Public method để các component có thể sử dụng
     */
    extractErrorMessage(error: HttpErrorResponse): string {
        const errorBody = error.error;

        // Format 1: { message: "error message" }
        if (errorBody?.message && typeof errorBody.message === 'string') {
            return errorBody.message;
        }

        // Format 2: { errors: [{ message: "error" }] } hoặc { errors: ["error1", "error2"] }
        if (errorBody?.errors && Array.isArray(errorBody.errors)) {
            const messages = errorBody.errors.map((e: any) => {
                if (typeof e === 'string') {
                    return e;
                } else if (e?.message) {
                    return e.message;
                } else if (e?.error) {
                    return e.error;
                }
                return JSON.stringify(e);
            }).filter((msg: string) => msg); // Remove empty messages

            if (messages.length > 0) {
                return messages.join(', ');
            }
        }

        // Format 3: { error: "error message" }
        if (errorBody?.error && typeof errorBody.error === 'string') {
            return errorBody.error;
        }

        // Format 4: Response body là string trực tiếp
        if (typeof errorBody === 'string') {
            return errorBody;
        }

        // Format 5: { data: { message: "error" } }
        if (errorBody?.data?.message) {
            return errorBody.data.message;
        }

        // Format 6: { statusCode, status, message } (NestJS format)
        if (errorBody?.message && typeof errorBody.message === 'string') {
            return errorBody.message;
        }

        // Default messages theo status code
        switch (error.status) {
            case 400:
                return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin nhập vào';
            case 404:
                return 'Không tìm thấy tài nguyên yêu cầu';
            case 405:
                return 'Phương thức không được phép';
            case 408:
                return 'Request timeout. Vui lòng thử lại';
            case 409:
                return 'Dữ liệu đã tồn tại hoặc xung đột';
            case 422:
                return 'Dữ liệu không thể xử lý';
            case 429:
                return 'Quá nhiều requests. Vui lòng thử lại sau';
            case 500:
                return 'Lỗi server. Vui lòng thử lại sau';
            case 502:
                return 'Bad Gateway. Server đang gặp sự cố';
            case 503:
                return 'Service không khả dụng. Vui lòng thử lại sau';
            case 504:
                return 'Gateway timeout. Vui lòng thử lại sau';
            default:
                return `Lỗi ${error.status}: ${error.message || 'Đã xảy ra lỗi không xác định'}`;
        }
    }
}

