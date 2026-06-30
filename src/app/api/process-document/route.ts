import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";

export async function POST(req: NextRequest) {
  try {
    const { title, content } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ error: "title and content are required" }, { status: 400 });
    }

    const prompt = `Create a row in the documents table with title '${title}' and this content: '${content.replace(/'/g, "")}'. Then generate a summary (5-8 sentences) and a quiz of 5 multiple choice questions based on the content, and update that row's summary, quiz, and status to ready.`;

    await runLemmaAgent(prompt);

    const record = await getLatestRecordByTitle(title);

    if (!record) {
      return NextResponse.json({ error: "Could not find the created record." }, { status: 500 });
    }

    return NextResponse.json({
      summary: record.summary,
      quiz: record.quiz,
      status: record.status,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function runLemmaAgent(message: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn("lemma", ["agent", "run", "study-assistant", message, "--pod", "studentos2", "--json"]);

    let stderrBuf = "";

    proc.stdout.on("data", () => {});
    proc.stderr.on("data", (data) => {
      stderrBuf += data.toString();
      console.error("lemma stderr:", data.toString());
    });

    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error("Agent run failed with exit code " + code + ". " + stderrBuf.slice(0, 500)));
    });

    proc.on("error", (err) => reject(err));
  });
}

function getLatestRecordByTitle(title: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const proc = spawn("lemma", ["records", "list", "documents", "--pod", "studentos2", "--json"]);

    let buffer = "";
    let stderrBuf = "";

    proc.stdout.on("data", (data) => (buffer += data.toString()));
    proc.stderr.on("data", (data) => {
      stderrBuf += data.toString();
      console.error("lemma stderr:", data.toString());
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error("records list failed with exit code " + code + ". " + stderrBuf.slice(0, 500)));
        return;
      }
      try {
        const parsed = JSON.parse(buffer);
        const items = (parsed.items || []) as any[];
        const matches = items
          .filter((r) => r.title === title && r.status === "ready")
          .sort(
            (a, b) =>
              new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
        resolve(matches[0] || null);
      } catch (e) {
        reject(e);
      }
    });

    proc.on("error", (err) => reject(err));
  });
}