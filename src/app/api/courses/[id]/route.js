import { getCourseById } from '@/utils/courses';

export function GET(request, { params }) {
  const { id } = params;
  const course = getCourseById(id);
  if (!course)
    return new Response(JSON.stringify({ error: 'not found' }), { status: 404 });
  return new Response(JSON.stringify(course), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
