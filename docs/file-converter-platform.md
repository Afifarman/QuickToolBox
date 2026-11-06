# QuickToolBox File Converter Platform

## Product requirements
- Public access: no login, no account, no paid API requirement.
- Default processing model: browser-local conversion; no file upload unless a future feature explicitly documents and obtains consent for it.
- Never advertise a format as supported until the conversion engine and output are tested.
- Show input limits, supported formats, compatibility notes, and actionable errors.
- Do not silently substitute a different output or label a placeholder/template as a conversion.

## Directory
The public hub lives at `/file-converter`. It groups document, image, video, audio, spreadsheet, presentation, e-book, archive, vector, CAD and font tools. Directory entries marked Planned are not live converters.

## Release phases
1. PDF and raster image workflows; validate merge, split, image-to-PDF, image format conversion and compression.
2. Audio/video codecs and media metadata; browser codec support must be detected at runtime.
3. Office, spreadsheet and e-book conversion using maintained open-source engines and verified licensing.
4. Archive, vector, CAD and font processing after parser security and format fidelity testing.

## Constraints
- $0 recurring API budget. Prefer open-source libraries and browser APIs.
- Do not add a paid hosted conversion dependency.
- Large files need explicit memory/input limits and cancellation/error handling.
- PDF rasterization must disclose that selectable text, links, forms and accessibility may be lost.
- Preview CI and functional smoke tests are required before merge.
- Merge and Production deployment require explicit user approval.
