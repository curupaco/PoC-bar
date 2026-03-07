const regex = new RegExp("^/((?!assets|logo.svg|manifest.json|sw.js|favicon.ico).*)$"); console.log(regex.test("/landing")); console.log(regex.test("/assets/file.js"));
