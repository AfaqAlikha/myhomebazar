import { HttpContextToken } from '@angular/common/http';

/** When true, GetLoaderInterceptor will not show the full-page loader. */
export const SKIP_GLOBAL_LOADER = new HttpContextToken<boolean>(() => false);
