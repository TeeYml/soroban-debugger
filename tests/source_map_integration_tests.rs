#[path = "fixtures/mod.rs"]
mod fixtures;

use soroban_debugger::debugger::source_map::SourceMap;

#[test]
fn source_map_missing_debug_info_is_graceful() {
    let wasm = fixtures::get_fixture_path(fixtures::names::COUNTER);
    if !wasm.exists() {
        eprintln!(
            "Skipping test: fixture not found at {}. Run tests/fixtures/build.sh to build fixtures.",
            wasm.display()
        );
        return;
    }

    let bytes = std::fs::read(&wasm).unwrap();
    let mut sm = SourceMap::new();
    sm.load(&bytes).expect("load should not fail");
    assert!(
        sm.is_empty(),
        "expected no DWARF mappings in stripped fixture"
    );
}

#[test]
fn source_map_debug_fixture_resolves_locations() {
    let Some(wasm) = fixtures::try_artifact_path(fixtures::names::COUNTER, "debug") else {
        eprintln!(
            "Skipping test: debug artifact missing from {}. Run tests/fixtures/build.sh to generate debug fixtures.",
            fixtures::manifest_path().display()
        );
        return;
    };

    if !wasm.exists() {
        eprintln!(
            "Skipping test: debug fixture not found at {}. Run tests/fixtures/build.sh to generate *_debug.wasm fixtures.",
            wasm.display()
        );
        return;
    }

    let bytes = std::fs::read(&wasm).unwrap();
    let mut sm = SourceMap::new();
    sm.load(&bytes).expect("load should not fail");

    assert!(!sm.is_empty(), "expected DWARF mappings in debug fixture");

    let (first_offset, first_loc) = sm.mappings().next().expect("at least one mapping");
    assert!(first_loc.line > 0, "expected non-zero line numbers");

    let looked_up = sm.lookup(first_offset).expect("lookup should succeed");
    assert_eq!(&looked_up, first_loc);

    assert!(sm.lookup(first_offset.saturating_add(1)).is_some());
}
