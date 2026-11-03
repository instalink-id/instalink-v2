import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

type HttpResponse = {
  status: (statusCode: number) => HttpResponse;
  json: (body: unknown) => void;
  getHeader: (name: string) => string | number | string[] | undefined;
};

const exposedExceptionCodes = new Set([
  'PASSWORD_CHANGE_REQUIRED',
  'TEMPORARY_PASSWORD_EXPIRED',
]);

function errorCode(status: number) {
  if (status === HttpStatus.NOT_FOUND) return 'NOT_FOUND';
  if (status === HttpStatus.BAD_REQUEST) return 'BAD_REQUEST';
  if (status === HttpStatus.UNAUTHORIZED) return 'UNAUTHORIZED';
  if (status === HttpStatus.FORBIDDEN) return 'FORBIDDEN';
  if (status === HttpStatus.CONFLICT) return 'CONFLICT';
  return 'INTERNAL_SERVER_ERROR';
}

@Catch(HttpException)
export class HttpErrorFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<HttpResponse>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    const exceptionCode =
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'code' in exceptionResponse &&
      typeof exceptionResponse.code === 'string'
        ? exceptionResponse.code
        : undefined;
    const code =
      exceptionCode && exposedExceptionCodes.has(exceptionCode)
        ? exceptionCode
        : errorCode(status);
    const message =
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
        ? exceptionResponse.message
        : exception.message;

    response.status(status).json({
      code,
      message,
      requestId: response.getHeader('X-Request-Id'),
    });
  }
}
