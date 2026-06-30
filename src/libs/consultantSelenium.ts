const stripTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const SELENIUM = {
    baseUrl: stripTrailingSlash(process.env.SELENIUM_API_URL ?? 'http://176.113.81.193:8000'),
    apiToken: process.env.SELENIUM_API_TOKEN ?? '',
    login: process.env.SELENIUM_CONSULTANT_LOGIN ?? '',
    password: process.env.SELENIUM_CONSULTANT_PASSWORD ?? '',
    authPath: process.env.SELENIUM_AUTH_PATH ?? '/auth',
    queryPath: process.env.SELENIUM_QUERY_PATH ?? '/query_html',
    timeoutMs: Number(process.env.SELENIUM_TIMEOUT_MS ?? 5 * 60 * 1000),
};

const AUTH_LOGIN_FIELD = 'login';
const AUTH_PASSWORD_FIELD = 'password';
const QUERY_FIELD = 'text';
const QUERY_MAX_LENGTH = 4000;

const ANSWER_KEYS = ['response_html', 'response_markdown', 'response', 'answer', 'reply', 'text', 'content', 'output'];
const WRAPPER_KEYS = ['data', 'result', 'payload', 'message'];
const TOKEN_KEYS = ['token', 'access_token', 'accessToken', 'session_token', 'sessionToken', 'session_id', 'sessionId', 'session', 'sid'];

export class ConsultantSeleniumError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ConsultantSeleniumError';
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pickString = (body: any, keys: string[]): string | null => {
    if (!body || typeof body !== 'object') return null;
    for (const key of keys) {
        const value = body[key];
        if (typeof value === 'string' && value.trim().length > 0) return value;
    }
    return null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const extractAnswer = (body: any): string | null => {
    if (typeof body === 'string') return body.trim().length > 0 ? body : null;
    if (Array.isArray(body)) {
        for (const item of body) {
            const found = extractAnswer(item);
            if (found) return found;
        }
        return null;
    }
    if (!body || typeof body !== 'object') return null;
    const direct = pickString(body, ANSWER_KEYS);
    if (direct) return direct;
    for (const key of WRAPPER_KEYS) {
        if (key in body) {
            const nested = extractAnswer(body[key]);
            if (nested) return nested;
        }
    }
    return null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const extractError = (status: number, body: any): string => {
    if (body && typeof body === 'object') {
        const detail = body.detail ?? body.message ?? body.error;
        if (typeof detail === 'string' && detail.trim().length > 0) return detail;
        if (Array.isArray(detail)) {
            const msgs = detail.map((d) => (d && typeof d.msg === 'string' ? d.msg : '')).filter(Boolean);
            if (msgs.length > 0) return msgs.join('; ');
        }
    }
    if (typeof body === 'string' && body.trim().length > 0) return body;
    return `HTTP ${status}`;
};

const cookieHeaderFrom = (res: Response): string | null => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getSetCookie = (res.headers as any).getSetCookie;
    const list: string[] = typeof getSetCookie === 'function' ? getSetCookie.call(res.headers) : [];
    const source = list && list.length > 0 ? list : (res.headers.get('set-cookie') ? [res.headers.get('set-cookie') as string] : []);
    const pairs = source.map((c) => c.split(';')[0].trim()).filter(Boolean);
    return pairs.length > 0 ? pairs.join('; ') : null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const callSelenium = async (path: string, payload: Record<string, unknown>, extraHeaders: Record<string, string> = {}): Promise<{ res: Response; body: any }> => {
    let res: Response;
    try {
        res = await fetch(SELENIUM.baseUrl + path, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'x-api-token': SELENIUM.apiToken,
                ...extraHeaders,
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(SELENIUM.timeoutMs),
        });
    } catch (err) {
        const reason = (err as Error)?.name === 'TimeoutError' ? 'превышено время ожидания ответа' : 'нет соединения с сервисом';
        throw new ConsultantSeleniumError(`Не удалось обратиться к сервису Консультант+ (${reason}).`);
    }

    const raw = await res.text();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: any = raw;
    try {
        body = raw ? JSON.parse(raw) : null;
    } catch {
        body = raw;
    }
    return { res, body };
};

export async function sendConsultantSeleniumQuery(question: string): Promise<string> {
    const trimmed = (question ?? '').trim();
    if (!trimmed) {
        throw new ConsultantSeleniumError('Пустой вопрос: нечего отправлять в Консультант+.');
    }

    if (!SELENIUM.apiToken || !SELENIUM.login || !SELENIUM.password) {
        throw new ConsultantSeleniumError('Не настроены доступы к сервису Консультант+ (проверьте SELENIUM_* в конфиге).');
    }

    const auth = await callSelenium(SELENIUM.authPath, {
        [AUTH_LOGIN_FIELD]: SELENIUM.login,
        [AUTH_PASSWORD_FIELD]: SELENIUM.password,
    });

    if (!auth.res.ok) {
        throw new ConsultantSeleniumError(`Ошибка авторизации в Консультант+: ${extractError(auth.res.status, auth.body)}`);
    }

    const sessionHeaders: Record<string, string> = {};
    const cookie = cookieHeaderFrom(auth.res);
    if (cookie) sessionHeaders['Cookie'] = cookie;
    const token = pickString(auth.body, TOKEN_KEYS);
    if (token) sessionHeaders['Authorization'] = `Bearer ${token}`;

    const query = await callSelenium(SELENIUM.queryPath, { [QUERY_FIELD]: trimmed.slice(0, QUERY_MAX_LENGTH) }, sessionHeaders);

    if (!query.res.ok) {
        throw new ConsultantSeleniumError(`Ошибка запроса в Консультант+: ${extractError(query.res.status, query.body)}`);
    }

    const answer = extractAnswer(query.body);
    if (!answer) {
        throw new ConsultantSeleniumError('Консультант+ вернул пустой ответ.');
    }
    return answer.trim();
}
