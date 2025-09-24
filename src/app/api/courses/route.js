import { courses } from '@/utils/courses';

export function GET() {
  return new Response(JSON.stringify(courses), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
