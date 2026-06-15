/// Minimal ferris-says: prints a speech bubble and Ferris the crab.
/// Used by the sindri-ferris-says extension to validate native binary bundling (ADR-0036).
fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let msg = if args.is_empty() {
        "Hello from Sindri!".to_string()
    } else {
        args.join(" ")
    };

    let width = msg.len().max(18);
    let border: String = "-".repeat(width + 2);

    // Word-wrap the message to `width` columns.
    let mut lines: Vec<String> = Vec::new();
    let mut current = String::new();
    for word in msg.split_whitespace() {
        if !current.is_empty() && current.len() + 1 + word.len() > width {
            lines.push(current.clone());
            current = word.to_string();
        } else {
            if !current.is_empty() {
                current.push(' ');
            }
            current.push_str(word);
        }
    }
    if !current.is_empty() {
        lines.push(current);
    }

    println!(" {border}");
    for line in &lines {
        println!("| {line:<width$} |");
    }
    println!(" {border}");
    println!("        \\");
    println!("         \\");
    println!("            _~^~^~_");
    println!("        \\) /  o o  \\ (/");
    println!("          '_   -   _'");
    println!("          / '-----' \\");
}
