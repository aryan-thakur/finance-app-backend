import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

function serializeBigInt(value: any): any {
  if (value === null || value === undefined) return value;
  const t = typeof value;
  if (t === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map(serializeBigInt);
  if (t === 'object') {
    // Leave Date as-is; JSON serializer will handle it
    if (value instanceof Date) return value;
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = serializeBigInt(v);
    }
    return out;
  }
  return value;
}

@Injectable()
export class BigIntSerializerInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => serializeBigInt(data)));
  }
}

