import { NextRequest, NextResponse } from 'next/server';
import {getContacts, getTotalContacts, createClientContact, updateContactEmailStatus} from "@/src/repositories/contacts/repo"
import {DBContact} from "@/src/interfaces/db"
import logger from "@/src/libs/logger"
import { UserContactRequest } from '@/src/interfaces/api';
import { EmailContactDataI } from '@/src/interfaces/email';
import { sendContactEmail } from '@/src/libs/email/senders';
import { EmailStatusesE } from '@/src/interfaces/data';

export const dynamic = 'force-dynamic'; // defaults to auto

export async function GET(request: NextRequest) {
    const msg = 'API CONTACTS GET - '
    // logger.info(msg + "request", request)
    const searchParams = request.nextUrl.searchParams;
    const _filter = searchParams.get('filter') ?? "";
    const range = searchParams.get('range') ?? '[0,9]';
    const _range = range.slice(1, range.length-1).split(",").map(Number);
    const _sort = searchParams.get('sort') ?? '';
    const sort = _sort ?  JSON.parse(_sort) : null

    let limit = searchParams.get('limit');
    if (!limit && _range.length > 0) {
        limit = (_range[1] - _range[0] + 1).toString()
    } else if(!limit) {
        limit = '10'
    }
    let page = searchParams.get('page');
    if (!page && _range.length > 0) {
        page = Math.ceil((_range[1] + 1)/parseInt(limit)).toString()
    } else if(!page) {
        page = '1'
    }
    const filter = _filter ?  JSON.parse(_filter) : null
    logger.info(msg + 'params', limit, page, sort, filter)

    let contacts: DBContact[] | null = []
    let total: number = 0;
    try {
        contacts = await getContacts(page, limit, sort, filter)
        total = await getTotalContacts(filter)
    } catch(err) {
        logger.error(msg + "ERROR", (err as Error).message)
        return NextResponse.json(
            { success: false, message: msg + 'error during get questions info.' },
            { status: 401 }
        );
    }
    const response = NextResponse.json(contacts, { status: 200 });
    const header_str = _range[0] + '-' + _range[1] + '/' + total
    response.headers.set("Content-Range", "contacts " + header_str)
    response.headers.set("X-Total-Count", total.toString())
    return response 
}

export async function POST(request: Request) {
    const msg = "API CONTACTS POST - "
    // logger.info(msg + "request", request)
    const inserted: UserContactRequest = await request.json(); 
    logger.info(msg + "request json", inserted)

    let contact: DBContact | null = null
    try {
        contact = await createClientContact(inserted)
        // logger.info(msg + 'contact', contact)
        if(contact === null) {
            logger.error(msg + "Empty response from createClientContact", inserted)
            return NextResponse.json(
                { success: false, message: 'Error during add contact(1).' },
                { status: 404 }
            );
        }

    } catch(err) {
        logger.error(msg + "error during add contact", (err as Error).message)
        return NextResponse.json(
            { success: false, message: 'Error during add contact(2).' },
            { status: 401 }
        );
    }

    if(contact !== null) {
        const sendData: EmailContactDataI = {
            id: parseInt(contact.id),
            user_id: contact.user_id,
            user_name: contact.user_name,
            email: contact.email,
            message: contact.message,
            phone: contact.phone,
            created_at: contact.created_at,
        }
        const isSendEmail = await sendContactEmail(sendData)
        let email_status = EmailStatusesE.Sent
        if(!isSendEmail) {
            logger.error(msg + "email on new contact request event was not sent", sendData)
            email_status = EmailStatusesE.Error
        }
        await updateContactEmailStatus(parseInt(contact.id), email_status)
        contact.email_status = email_status
    }
    
    // logger.info(msg + 'created ', question)
    const response = NextResponse.json(contact, { status: 200 });
    response.headers.set("X-Total-Count", "1")
    return response
}

export async function PUT(request: Request) {
    return handler(request);
}

export async function PATCH(request: Request) {
    return handler(request);
}

export async function DELETE(request: Request) {
    return handler(request);
}

async function handler(request: Request) {
    // get part after /api/admin/ in string url
    const requestUrl = request.url.split('/api/contacts')[1];

    // build the CRUD request based on the incoming request
    const url = `${process.env.SUPABASE_URL}/rest/v1${requestUrl}`;

    const options: RequestInit = {
        method: request.method,
        headers: {
            prefer: (request.headers.get('prefer') as string) ?? '',
            accept: request.headers.get('accept') ?? 'application/json',
            ['content-type']:
                request.headers.get('content-type') ?? 'application/json',
        },
    };

    if (request.body) {
        const body = await request.json();
        options.body = JSON.stringify(body);
    }

    // call the CRUD API
    const response = await fetch(url, options);

    const contentRange = response.headers.get('content-range');

    const headers = new Headers();
    if (contentRange) {
        headers.set('Content-Range', contentRange);
    }
    const data = await response.text();
    return new Response(data, {
        status: 200,
        headers,
    });
}