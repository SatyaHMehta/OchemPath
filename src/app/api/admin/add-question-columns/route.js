import supabaseAdmin from "@/lib/supabaseServer";

export async function POST(request) {
  try {
    console.log("Attempting to add published column to questions table...");

    // Try to add the published column
    const { error } = await supabaseAdmin.rpc('exec', {
      sql: `
        ALTER TABLE questions 
        ADD COLUMN IF NOT EXISTS published boolean DEFAULT false;
        
        ALTER TABLE questions 
        ADD COLUMN IF NOT EXISTS chapter_id uuid REFERENCES chapters(id) ON DELETE CASCADE;
        
        ALTER TABLE questions 
        ADD COLUMN IF NOT EXISTS is_practice boolean DEFAULT false;
        
        COMMENT ON COLUMN questions.published IS 'Whether the question is published and visible to students';
        COMMENT ON COLUMN questions.chapter_id IS 'Direct reference to chapter for practice questions';
        COMMENT ON COLUMN questions.is_practice IS 'Whether this is a practice question';
      `
    });

    if (error) {
      console.error("Error adding columns:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    console.log("Successfully added columns to questions table");

    return Response.json({ 
      success: true, 
      message: "Published, chapter_id, and is_practice columns added to questions table" 
    }, { status: 200 });

  } catch (error) {
    console.error("Server error adding columns:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}