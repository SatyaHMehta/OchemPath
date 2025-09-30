import { createClient } from "@supabase/supabase-js";

// Create Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const { published } = await request.json();

    console.log(`${published ? 'Publishing' : 'Unpublishing'} question:`, id);

    // Validate input
    if (typeof published !== 'boolean') {
      return Response.json(
        { error: "Published field must be a boolean" },
        { status: 400 }
      );
    }

    // First try to add the column if it doesn't exist
    try {
      // Check if column exists by trying a simple select
      await supabaseAdmin
        .from("questions")
        .select("published")
        .limit(1);
    } catch (columnError) {
      // If column doesn't exist, try to add it
      console.log("Published column doesn't exist, attempting to add it...");
      
      // For now, return a helpful error message
      return Response.json(
        { 
          error: "Database schema update needed",
          details: "The 'published' column needs to be added to the questions table. Please run the database migration or contact your administrator.",
          code: "MISSING_COLUMN"
        },
        { status: 500 }
      );
    }

    // Update the question's published status
    const { data, error } = await supabaseAdmin
      .from("questions")
      .update({ published })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating question published status:", error);
      
      if (error.code === 'PGRST204' && error.message.includes("published")) {
        return Response.json(
          { 
            error: "Database column missing",
            details: "The 'published' column doesn't exist in the questions table. Please add it manually or run the migration.",
            sqlCommand: "ALTER TABLE questions ADD COLUMN published boolean DEFAULT false;"
          },
          { status: 500 }
        );
      }
      
      return Response.json(
        { error: "Failed to update question" },
        { status: 500 }
      );
    }

    console.log(`Question ${published ? 'published' : 'unpublished'} successfully:`, data);

    return Response.json(data, { status: 200 });
  } catch (error) {
    console.error("Server error updating question:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}