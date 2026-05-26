/**
 * Swagger-codegen-style клиент (axios): заявка — группа `interplanetaryFlights`
 * (REST `/interplanetaryflightrequests/...` на бэкенде), связь планета–заявка (m-m) —
 * `planetsInFlights`.
 *
 * Каталог планет и пользователи — отдельный axios (planetsApi, authApi), лаб. 7.
 */

export interface WebBackendInternalAppSerializerPlanetJSON {
  planet_id?: number;
  title?: string;
  from_body?: string;
  to_body?: string;
  description?: string;
  image_url?: string;
  video_url?: string;
  from_orbit_radius_km?: number;
  to_orbit_radius_km?: number;
  short_description_en?: string;
  is_deleted?: boolean;
}

export interface WebBackendInternalAppSerializerInterplanetaryFlightRequestJSON {
  /** ID в ответе списка (бэкенд: `id`). */
  id?: number;
  interplanetary_flight_request_id?: number;
  status?: string;
  created_at?: string;
  creator_login?: string;
  moderator_login?: string | null;
  /** Дата формирования: в списке — `formed_at`, в swagger — `forming_date`. */
  formed_at?: string | null;
  forming_date?: string | null;
  /** Дата завершения: в списке — `completed_at`, в swagger — `finish_date`. */
  completed_at?: string | null;
  finish_date?: string | null;
  description?: string | null;
  theme?: string | null;
  spacecraft_dry_mass_kg?: number;
  total_fuel_mass_kg?: number | null;
  route_count?: number;
  routes_count?: number;
  segments_with_result?: number;
}

export interface WebBackendInternalAppSerializerFlightInRequestJSON {
  route_id?: number;
  segment_order?: number;
  quantity?: number;
  segment_dry_mass_kg?: number;
  segment_isp_sec?: number;
}

export interface WebBackendInternalAppSerializerFlightInRequestDetailJSON {
  interplanetary_flight_request_id?: number;
  planet_id?: number;
  segment_order?: number;
  quantity?: number;
  is_primary?: boolean;
  delta_v_ms?: number;
  propellant_kg?: number;
  planet: WebBackendInternalAppSerializerPlanetJSON;
}

export interface WebBackendInternalAppSerializerStatusJSON {
  status?: string;
}

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, unknown>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  secure?: boolean;
  path: string;
  type?: ContentType;
  query?: QueryParamsType;
  format?: ResponseType;
  body?: unknown;
}

export type RequestParams = Omit<FullRequestParams, "body" | "method" | "query" | "path">;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export const ContentType = {
  Json: "application/json",
  JsonApi: "application/vnd.api+json",
  FormData: "multipart/form-data",
  UrlEncoded: "application/x-www-form-urlencoded",
  Text: "text/plain",
} as const;

export type ContentType = (typeof ContentType)[keyof typeof ContentType];

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || "//localhost:8080/api",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[method.toLowerCase() as keyof HeadersDefaults]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    }
    return `${formItem}`;
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: unknown[] = property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(key, isFileType ? formItem : this.stringifyFormItem(formItem));
      }

      return formData;
    }, new FormData());
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public request = async <T = unknown, _E = unknown>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    let reqBody: unknown = body;
    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      reqBody = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== "string"
    ) {
      reqBody = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: reqBody,
      url: path,
    });
  };
}

export class Api<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /** Заявка на расчёт (в URL фронта — `interplanetary_flights`; здесь пути к API Gin). */
  interplanetaryFlights = {
    interplanetaryFlightRequestCartList: (params: RequestParams = {}) =>
      this.request<Record<string, unknown>, Record<string, string>>({
        path: `/interplanetaryflightrequests/cart-icon`,
        method: "GET",
        format: "json",
        ...params,
      }),

    allInterplanetaryFlightRequestsList: (
      query?: {
        from?: string;
        to?: string;
        status?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        WebBackendInternalAppSerializerInterplanetaryFlightRequestJSON[],
        Record<string, string>
      >({
        path: `/interplanetaryflightrequests`,
        method: "GET",
        query,
        secure: true,
        format: "json",
        ...params,
      }),

    interplanetaryFlightRequestDetail: (id: number, params: RequestParams = {}) =>
      this.request<Record<string, unknown>, Record<string, string>>({
        path: `/interplanetaryflightrequests/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    editInterplanetaryFlightRequestUpdate: (
      id: number,
      body: WebBackendInternalAppSerializerInterplanetaryFlightRequestJSON,
      params: RequestParams = {},
    ) =>
      this.request<
        WebBackendInternalAppSerializerInterplanetaryFlightRequestJSON,
        Record<string, string>
      >({
        path: `/interplanetaryflightrequests/${id}`,
        method: "PUT",
        body,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    deleteInterplanetaryFlightRequestDelete: (id: number, params: RequestParams = {}) =>
      this.request<Record<string, string>, Record<string, string>>({
        path: `/interplanetaryflightrequests/${id}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    formInterplanetaryFlightRequestUpdate: (id: number, params: RequestParams = {}) =>
      this.request<
        WebBackendInternalAppSerializerInterplanetaryFlightRequestJSON,
        Record<string, string>
      >({
        path: `/interplanetaryflightrequests/${id}/form`,
        method: "PUT",
        secure: true,
        format: "json",
        ...params,
      }),

    moderateInterplanetaryFlightRequestUpdate: (
      id: number,
      status: { action?: string },
      params: RequestParams = {},
    ) =>
      this.request<
        WebBackendInternalAppSerializerInterplanetaryFlightRequestJSON,
        Record<string, string>
      >({
        path: `/interplanetaryflightrequests/${id}/moderate`,
        method: "PUT",
        body: status,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };

  /** Планеты в заявке (m-m; в тематике — `planets_in_flights`). */
  planetsInFlights = {
    addPlanetToFlightRequestDraft: (
      data: { route_id: number },
      params: RequestParams = {},
    ) =>
      this.request<
        WebBackendInternalAppSerializerInterplanetaryFlightRequestJSON,
        Record<string, string>
      >({
        path: `/interplanetaryflightrequests/draft/items`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    updateFlightInRequestLine: (
      planetId: number,
      flightRequestId: number,
      data: WebBackendInternalAppSerializerFlightInRequestJSON,
      params: RequestParams = {},
    ) =>
      this.request<
        WebBackendInternalAppSerializerFlightInRequestJSON,
        Record<string, string>
      >({
        path: `/interplanetaryflightrequests/${flightRequestId}/items/${planetId}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    deleteFlightInRequestLine: (
      planetId: number,
      flightRequestId: number,
      params: RequestParams = {},
    ) =>
      this.request<
        WebBackendInternalAppSerializerInterplanetaryFlightRequestJSON,
        Record<string, string>
      >({
        path: `/interplanetaryflightrequests/${flightRequestId}/items/${planetId}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),
  };
}
