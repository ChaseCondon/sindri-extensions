/// Approximate GPT-4 token count given a UTF-8 string passed via WASM linear memory.
///
/// The approximation: 1 token ≈ 4 UTF-8 bytes for English text (empirical GPT-4 rule
/// of thumb). This is intentionally simple — the purpose is to validate the
/// sindri.wasm.load() extension API, not to ship a production BPE tokeniser.
///
/// # Memory layout
/// The extension writes the document text into WASM linear memory starting at `ptr`,
/// with `len` bytes. The function reads those bytes to count whitespace-separated
/// "words" as a secondary signal alongside the char-based approximation, then returns
/// the greater of the two estimates (words are usually a better lower-bound for
/// natural language; char/4 is better for code with long identifiers).
///
/// # Safety
/// `ptr` must be a valid offset into WASM linear memory with at least `len` bytes
/// available from that offset.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn approx_tokens(ptr: *const u8, len: u32) -> u32 {
    let bytes = unsafe { std::slice::from_raw_parts(ptr, len as usize) };

    // char/4 estimate
    let char_estimate = (len + 3) / 4;

    // word-count estimate: count whitespace-separated runs
    let mut word_count: u32 = 0;
    let mut in_word = false;
    for &b in bytes {
        let is_ws = b == b' ' || b == b'\t' || b == b'\n' || b == b'\r';
        if !is_ws && !in_word {
            word_count += 1;
            in_word = true;
        } else if is_ws {
            in_word = false;
        }
    }

    // Take the larger of the two estimates; minimum 1 if there is any content.
    let estimate = char_estimate.max(word_count);
    if len == 0 { 0 } else { estimate.max(1) }
}
