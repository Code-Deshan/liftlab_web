// Compiles a dart2wasm-generated main module from `source` which can then
// instantiatable via the `instantiate` method.
//
// `source` needs to be a `Response` object (or promise thereof) e.g. created
// via the `fetch()` JS API.
export async function compileStreaming(source) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(
      await WebAssembly.compileStreaming(source, builtins), builtins);
}

// Compiles a dart2wasm-generated wasm modules from `bytes` which is then
// instantiatable via the `instantiate` method.
export async function compile(bytes) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(await WebAssembly.compile(bytes, builtins), builtins);
}

// DEPRECATED: Please use `compile` or `compileStreaming` to get a compiled app,
// use `instantiate` method to get an instantiated app and then call
// `invokeMain` to invoke the main function.
export async function instantiate(modulePromise, importObjectPromise) {
  var moduleOrCompiledApp = await modulePromise;
  if (!(moduleOrCompiledApp instanceof CompiledApp)) {
    moduleOrCompiledApp = new CompiledApp(moduleOrCompiledApp);
  }
  const instantiatedApp = await moduleOrCompiledApp.instantiate(await importObjectPromise);
  return instantiatedApp.instantiatedModule;
}

// DEPRECATED: Please use `compile` or `compileStreaming` to get a compiled app,
// use `instantiate` method to get an instantiated app and then call
// `invokeMain` to invoke the main function.
export const invoke = (moduleInstance, ...args) => {
  moduleInstance.exports.$invokeMain(args);
}

class CompiledApp {
  constructor(module, builtins) {
    this.module = module;
    this.builtins = builtins;
  }

  // The second argument is an options object containing:
  // `loadDeferredWasm` is a JS function that takes a module name matching a
  //   wasm file produced by the dart2wasm compiler and returns the bytes to
  //   load the module. These bytes can be in either a format supported by
  //   `WebAssembly.compile` or `WebAssembly.compileStreaming`.
  // `loadDynamicModule` is a JS function that takes two string names matching,
  //   in order, a wasm file produced by the dart2wasm compiler during dynamic
  //   module compilation and a corresponding js file produced by the same
  //   compilation. It should return a JS Array containing 2 elements. The first
  //   should be the bytes for the wasm module in a format supported by
  //   `WebAssembly.compile` or `WebAssembly.compileStreaming`. The second
  //   should be the result of using the JS 'import' API on the js file path.
  async instantiate(additionalImports, {loadDeferredWasm, loadDynamicModule} = {}) {
    let dartInstance;

    // Prints to the console
    function printToConsole(value) {
      if (typeof dartPrint == "function") {
        dartPrint(value);
        return;
      }
      if (typeof console == "object" && typeof console.log != "undefined") {
        console.log(value);
        return;
      }
      if (typeof print == "function") {
        print(value);
        return;
      }

      throw "Unable to print message: " + value;
    }

    // A special symbol attached to functions that wrap Dart functions.
    const jsWrappedDartFunctionSymbol = Symbol("JSWrappedDartFunction");

    function finalizeWrapper(dartFunction, wrapped) {
      wrapped.dartFunction = dartFunction;
      wrapped[jsWrappedDartFunctionSymbol] = true;
      return wrapped;
    }

    // Imports
    const dart2wasm = {
            _4: (o, c) => o instanceof c,
      _6: (o,s,v) => o[s] = v,
      _7: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._7(f,arguments.length,x0) }),
      _8: f => finalizeWrapper(f, function(x0,x1) { return dartInstance.exports._8(f,arguments.length,x0,x1) }),
      _9: (o, a) => o + a,
      _37: x0 => new Array(x0),
      _39: x0 => x0.length,
      _41: (x0,x1) => x0[x1],
      _42: (x0,x1,x2) => { x0[x1] = x2 },
      _43: x0 => new Promise(x0),
      _45: (x0,x1,x2) => new DataView(x0,x1,x2),
      _47: x0 => new Int8Array(x0),
      _48: (x0,x1,x2) => new Uint8Array(x0,x1,x2),
      _49: x0 => new Uint8Array(x0),
      _51: x0 => new Uint8ClampedArray(x0),
      _53: x0 => new Int16Array(x0),
      _55: x0 => new Uint16Array(x0),
      _57: x0 => new Int32Array(x0),
      _59: x0 => new Uint32Array(x0),
      _61: x0 => new Float32Array(x0),
      _63: x0 => new Float64Array(x0),
      _65: (x0,x1,x2) => x0.call(x1,x2),
      _67: (x0,x1) => x0.call(x1),
      _69: () => Symbol("jsBoxedDartObjectProperty"),
      _70: (decoder, codeUnits) => decoder.decode(codeUnits),
      _71: () => new TextDecoder("utf-8", {fatal: true}),
      _72: () => new TextDecoder("utf-8", {fatal: false}),
      _73: (s) => +s,
      _74: x0 => new Uint8Array(x0),
      _75: (x0,x1,x2) => x0.set(x1,x2),
      _76: (x0,x1) => x0.transferFromImageBitmap(x1),
      _77: x0 => x0.arrayBuffer(),
      _78: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._78(f,arguments.length,x0) }),
      _79: x0 => new window.FinalizationRegistry(x0),
      _80: (x0,x1,x2,x3) => x0.register(x1,x2,x3),
      _81: (x0,x1) => x0.unregister(x1),
      _82: (x0,x1,x2) => x0.slice(x1,x2),
      _83: (x0,x1) => x0.decode(x1),
      _84: (x0,x1) => x0.segment(x1),
      _85: () => new TextDecoder(),
      _87: x0 => x0.click(),
      _88: x0 => x0.buffer,
      _89: x0 => x0.wasmMemory,
      _90: () => globalThis.window._flutter_skwasmInstance,
      _91: x0 => x0.rasterStartMilliseconds,
      _92: x0 => x0.rasterEndMilliseconds,
      _93: x0 => x0.imageBitmaps,
      _120: x0 => x0.remove(),
      _121: (x0,x1) => x0.append(x1),
      _122: (x0,x1,x2) => x0.insertBefore(x1,x2),
      _123: (x0,x1) => x0.querySelector(x1),
      _125: (x0,x1) => x0.removeChild(x1),
      _203: x0 => x0.stopPropagation(),
      _204: x0 => x0.preventDefault(),
      _206: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      _251: x0 => x0.unlock(),
      _252: x0 => x0.getReader(),
      _253: (x0,x1,x2) => x0.addEventListener(x1,x2),
      _254: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      _255: (x0,x1) => x0.item(x1),
      _256: x0 => x0.next(),
      _257: x0 => x0.now(),
      _258: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._258(f,arguments.length,x0) }),
      _259: (x0,x1) => x0.addListener(x1),
      _260: (x0,x1) => x0.removeListener(x1),
      _261: (x0,x1) => x0.matchMedia(x1),
      _262: (x0,x1) => x0.revokeObjectURL(x1),
      _263: x0 => x0.close(),
      _264: (x0,x1,x2,x3,x4) => ({type: x0,data: x1,premultiplyAlpha: x2,colorSpaceConversion: x3,preferAnimation: x4}),
      _265: x0 => new window.ImageDecoder(x0),
      _266: x0 => ({frameIndex: x0}),
      _267: (x0,x1) => x0.decode(x1),
      _268: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._268(f,arguments.length,x0) }),
      _269: (x0,x1) => x0.getModifierState(x1),
      _270: (x0,x1) => x0.removeProperty(x1),
      _271: (x0,x1) => x0.prepend(x1),
      _272: x0 => x0.disconnect(),
      _273: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._273(f,arguments.length,x0) }),
      _274: (x0,x1) => x0.getAttribute(x1),
      _275: (x0,x1) => x0.contains(x1),
      _276: x0 => x0.blur(),
      _277: x0 => x0.hasFocus(),
      _278: (x0,x1) => x0.hasAttribute(x1),
      _279: (x0,x1) => x0.getModifierState(x1),
      _280: (x0,x1) => x0.appendChild(x1),
      _281: (x0,x1) => x0.createTextNode(x1),
      _282: (x0,x1) => x0.removeAttribute(x1),
      _283: x0 => x0.getBoundingClientRect(),
      _284: (x0,x1) => x0.observe(x1),
      _285: x0 => x0.disconnect(),
      _286: (x0,x1) => x0.closest(x1),
      _696: () => globalThis.window.flutterConfiguration,
      _697: x0 => x0.assetBase,
      _703: x0 => x0.debugShowSemanticsNodes,
      _704: x0 => x0.hostElement,
      _705: x0 => x0.multiViewEnabled,
      _706: x0 => x0.nonce,
      _708: x0 => x0.fontFallbackBaseUrl,
      _712: x0 => x0.console,
      _713: x0 => x0.devicePixelRatio,
      _714: x0 => x0.document,
      _715: x0 => x0.history,
      _716: x0 => x0.innerHeight,
      _717: x0 => x0.innerWidth,
      _718: x0 => x0.location,
      _719: x0 => x0.navigator,
      _720: x0 => x0.visualViewport,
      _721: x0 => x0.performance,
      _723: x0 => x0.URL,
      _725: (x0,x1) => x0.getComputedStyle(x1),
      _726: x0 => x0.screen,
      _727: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._727(f,arguments.length,x0) }),
      _728: (x0,x1) => x0.requestAnimationFrame(x1),
      _733: (x0,x1) => x0.warn(x1),
      _735: (x0,x1) => x0.debug(x1),
      _736: x0 => globalThis.parseFloat(x0),
      _737: () => globalThis.window,
      _738: () => globalThis.Intl,
      _739: () => globalThis.Symbol,
      _740: (x0,x1,x2,x3,x4) => globalThis.createImageBitmap(x0,x1,x2,x3,x4),
      _742: x0 => x0.clipboard,
      _743: x0 => x0.maxTouchPoints,
      _744: x0 => x0.vendor,
      _745: x0 => x0.language,
      _746: x0 => x0.platform,
      _747: x0 => x0.userAgent,
      _748: (x0,x1) => x0.vibrate(x1),
      _749: x0 => x0.languages,
      _750: x0 => x0.documentElement,
      _751: (x0,x1) => x0.querySelector(x1),
      _754: (x0,x1) => x0.createElement(x1),
      _757: (x0,x1) => x0.createEvent(x1),
      _758: x0 => x0.activeElement,
      _761: x0 => x0.head,
      _762: x0 => x0.body,
      _764: (x0,x1) => { x0.title = x1 },
      _767: x0 => x0.visibilityState,
      _768: () => globalThis.document,
      _769: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._769(f,arguments.length,x0) }),
      _770: (x0,x1) => x0.dispatchEvent(x1),
      _778: x0 => x0.target,
      _780: x0 => x0.timeStamp,
      _781: x0 => x0.type,
      _783: (x0,x1,x2,x3) => x0.initEvent(x1,x2,x3),
      _790: x0 => x0.firstChild,
      _794: x0 => x0.parentElement,
      _796: (x0,x1) => { x0.textContent = x1 },
      _797: x0 => x0.parentNode,
      _799: x0 => x0.isConnected,
      _803: x0 => x0.firstElementChild,
      _805: x0 => x0.nextElementSibling,
      _806: x0 => x0.clientHeight,
      _807: x0 => x0.clientWidth,
      _808: x0 => x0.offsetHeight,
      _809: x0 => x0.offsetWidth,
      _810: x0 => x0.id,
      _811: (x0,x1) => { x0.id = x1 },
      _814: (x0,x1) => { x0.spellcheck = x1 },
      _815: x0 => x0.tagName,
      _816: x0 => x0.style,
      _818: (x0,x1) => x0.querySelectorAll(x1),
      _819: (x0,x1,x2) => x0.setAttribute(x1,x2),
      _820: x0 => x0.tabIndex,
      _821: (x0,x1) => { x0.tabIndex = x1 },
      _822: (x0,x1) => x0.focus(x1),
      _823: x0 => x0.scrollTop,
      _824: (x0,x1) => { x0.scrollTop = x1 },
      _825: x0 => x0.scrollLeft,
      _826: (x0,x1) => { x0.scrollLeft = x1 },
      _827: x0 => x0.classList,
      _829: (x0,x1) => { x0.className = x1 },
      _831: (x0,x1) => x0.getElementsByClassName(x1),
      _832: (x0,x1) => x0.attachShadow(x1),
      _835: x0 => x0.computedStyleMap(),
      _836: (x0,x1) => x0.get(x1),
      _842: (x0,x1) => x0.getPropertyValue(x1),
      _843: (x0,x1,x2,x3) => x0.setProperty(x1,x2,x3),
      _844: x0 => x0.offsetLeft,
      _845: x0 => x0.offsetTop,
      _846: x0 => x0.offsetParent,
      _848: (x0,x1) => { x0.name = x1 },
      _849: x0 => x0.content,
      _850: (x0,x1) => { x0.content = x1 },
      _854: (x0,x1) => { x0.src = x1 },
      _855: x0 => x0.naturalWidth,
      _856: x0 => x0.naturalHeight,
      _860: (x0,x1) => { x0.crossOrigin = x1 },
      _862: (x0,x1) => { x0.decoding = x1 },
      _863: x0 => x0.decode(),
      _868: (x0,x1) => { x0.nonce = x1 },
      _873: (x0,x1) => { x0.width = x1 },
      _875: (x0,x1) => { x0.height = x1 },
      _878: (x0,x1) => x0.getContext(x1),
      _937: x0 => x0.width,
      _938: x0 => x0.height,
      _940: (x0,x1) => x0.fetch(x1),
      _941: x0 => x0.status,
      _943: x0 => x0.body,
      _944: x0 => x0.arrayBuffer(),
      _947: x0 => x0.read(),
      _948: x0 => x0.value,
      _949: x0 => x0.done,
      _951: x0 => x0.name,
      _952: x0 => x0.x,
      _953: x0 => x0.y,
      _956: x0 => x0.top,
      _957: x0 => x0.right,
      _958: x0 => x0.bottom,
      _959: x0 => x0.left,
      _971: x0 => x0.height,
      _972: x0 => x0.width,
      _973: x0 => x0.scale,
      _974: (x0,x1) => { x0.value = x1 },
      _977: (x0,x1) => { x0.placeholder = x1 },
      _979: (x0,x1) => { x0.name = x1 },
      _980: x0 => x0.selectionDirection,
      _981: x0 => x0.selectionStart,
      _982: x0 => x0.selectionEnd,
      _985: x0 => x0.value,
      _987: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      _988: x0 => x0.readText(),
      _989: (x0,x1) => x0.writeText(x1),
      _991: x0 => x0.altKey,
      _992: x0 => x0.code,
      _993: x0 => x0.ctrlKey,
      _994: x0 => x0.key,
      _995: x0 => x0.keyCode,
      _996: x0 => x0.location,
      _997: x0 => x0.metaKey,
      _998: x0 => x0.repeat,
      _999: x0 => x0.shiftKey,
      _1000: x0 => x0.isComposing,
      _1002: x0 => x0.state,
      _1003: (x0,x1) => x0.go(x1),
      _1005: (x0,x1,x2,x3) => x0.pushState(x1,x2,x3),
      _1006: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      _1007: x0 => x0.pathname,
      _1008: x0 => x0.search,
      _1009: x0 => x0.hash,
      _1013: x0 => x0.state,
      _1016: (x0,x1) => x0.createObjectURL(x1),
      _1018: x0 => new Blob(x0),
      _1020: x0 => new MutationObserver(x0),
      _1021: (x0,x1,x2) => x0.observe(x1,x2),
      _1022: f => finalizeWrapper(f, function(x0,x1) { return dartInstance.exports._1022(f,arguments.length,x0,x1) }),
      _1025: x0 => x0.attributeName,
      _1026: x0 => x0.type,
      _1027: x0 => x0.matches,
      _1028: x0 => x0.matches,
      _1032: x0 => x0.relatedTarget,
      _1034: x0 => x0.clientX,
      _1035: x0 => x0.clientY,
      _1036: x0 => x0.offsetX,
      _1037: x0 => x0.offsetY,
      _1040: x0 => x0.button,
      _1041: x0 => x0.buttons,
      _1042: x0 => x0.ctrlKey,
      _1046: x0 => x0.pointerId,
      _1047: x0 => x0.pointerType,
      _1048: x0 => x0.pressure,
      _1049: x0 => x0.tiltX,
      _1050: x0 => x0.tiltY,
      _1051: x0 => x0.getCoalescedEvents(),
      _1054: x0 => x0.deltaX,
      _1055: x0 => x0.deltaY,
      _1056: x0 => x0.wheelDeltaX,
      _1057: x0 => x0.wheelDeltaY,
      _1058: x0 => x0.deltaMode,
      _1065: x0 => x0.changedTouches,
      _1068: x0 => x0.clientX,
      _1069: x0 => x0.clientY,
      _1072: x0 => x0.data,
      _1075: (x0,x1) => { x0.disabled = x1 },
      _1077: (x0,x1) => { x0.type = x1 },
      _1078: (x0,x1) => { x0.max = x1 },
      _1079: (x0,x1) => { x0.min = x1 },
      _1080: x0 => x0.value,
      _1081: (x0,x1) => { x0.value = x1 },
      _1082: x0 => x0.disabled,
      _1083: (x0,x1) => { x0.disabled = x1 },
      _1085: (x0,x1) => { x0.placeholder = x1 },
      _1087: (x0,x1) => { x0.name = x1 },
      _1089: (x0,x1) => { x0.autocomplete = x1 },
      _1090: x0 => x0.selectionDirection,
      _1092: x0 => x0.selectionStart,
      _1093: x0 => x0.selectionEnd,
      _1096: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      _1097: (x0,x1) => x0.add(x1),
      _1100: (x0,x1) => { x0.noValidate = x1 },
      _1101: (x0,x1) => { x0.method = x1 },
      _1102: (x0,x1) => { x0.action = x1 },
      _1103: (x0,x1) => new OffscreenCanvas(x0,x1),
      _1109: (x0,x1) => x0.getContext(x1),
      _1111: x0 => x0.convertToBlob(),
      _1128: x0 => x0.orientation,
      _1129: x0 => x0.width,
      _1130: x0 => x0.height,
      _1131: (x0,x1) => x0.lock(x1),
      _1150: x0 => new ResizeObserver(x0),
      _1153: f => finalizeWrapper(f, function(x0,x1) { return dartInstance.exports._1153(f,arguments.length,x0,x1) }),
      _1161: x0 => x0.length,
      _1162: x0 => x0.iterator,
      _1163: x0 => x0.Segmenter,
      _1164: x0 => x0.v8BreakIterator,
      _1165: (x0,x1) => new Intl.Segmenter(x0,x1),
      _1166: x0 => x0.done,
      _1167: x0 => x0.value,
      _1168: x0 => x0.index,
      _1172: (x0,x1) => new Intl.v8BreakIterator(x0,x1),
      _1173: (x0,x1) => x0.adoptText(x1),
      _1174: x0 => x0.first(),
      _1175: x0 => x0.next(),
      _1176: x0 => x0.current(),
      _1182: x0 => x0.hostElement,
      _1183: x0 => x0.viewConstraints,
      _1186: x0 => x0.maxHeight,
      _1187: x0 => x0.maxWidth,
      _1188: x0 => x0.minHeight,
      _1189: x0 => x0.minWidth,
      _1190: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1190(f,arguments.length,x0) }),
      _1191: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1191(f,arguments.length,x0) }),
      _1192: (x0,x1) => ({addView: x0,removeView: x1}),
      _1193: x0 => x0.loader,
      _1194: () => globalThis._flutter,
      _1195: (x0,x1) => x0.didCreateEngineInitializer(x1),
      _1196: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1196(f,arguments.length,x0) }),
      _1197: f => finalizeWrapper(f, function() { return dartInstance.exports._1197(f,arguments.length) }),
      _1198: (x0,x1) => ({initializeEngine: x0,autoStart: x1}),
      _1199: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1199(f,arguments.length,x0) }),
      _1200: x0 => ({runApp: x0}),
      _1201: f => finalizeWrapper(f, function(x0,x1) { return dartInstance.exports._1201(f,arguments.length,x0,x1) }),
      _1202: x0 => x0.length,
      _1203: () => globalThis.window.ImageDecoder,
      _1204: x0 => x0.tracks,
      _1206: x0 => x0.completed,
      _1208: x0 => x0.image,
      _1214: x0 => x0.displayWidth,
      _1215: x0 => x0.displayHeight,
      _1216: x0 => x0.duration,
      _1219: x0 => x0.ready,
      _1220: x0 => x0.selectedTrack,
      _1221: x0 => x0.repetitionCount,
      _1222: x0 => x0.frameCount,
      _1277: (x0,x1) => x0.querySelector(x1),
      _1278: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1278(f,arguments.length,x0) }),
      _1279: (x0,x1) => x0.removeChild(x1),
      _1280: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1280(f,arguments.length,x0) }),
      _1281: (x0,x1) => x0.appendChild(x1),
      _1282: x0 => x0.pause(),
      _1283: x0 => x0.play(),
      _1284: x0 => ({willReadFrequently: x0}),
      _1285: (x0,x1,x2) => x0.getContext(x1,x2),
      _1286: (x0,x1,x2,x3) => x0.drawImage(x1,x2,x3),
      _1287: (x0,x1,x2,x3,x4) => x0.getImageData(x1,x2,x3,x4),
      _1288: (x0,x1,x2) => x0.readBarcodes(x1,x2),
      _1289: (x0,x1,x2,x3) => ({formats: x0,tryHarder: x1,tryRotate: x2,tryInvert: x3}),
      _1290: (x0,x1,x2) => ({tryHarder: x0,tryRotate: x1,tryInvert: x2}),
      _1291: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1291(f,arguments.length,x0) }),
      _1292: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1292(f,arguments.length,x0) }),
      _1293: (x0,x1) => x0.append(x1),
      _1294: x0 => x0.getCapabilities(),
      _1295: () => ({}),
      _1296: (x0,x1) => x0.applyConstraints(x1),
      _1297: x0 => x0.enumerateDevices(),
      _1298: x0 => x0.getSupportedConstraints(),
      _1299: x0 => ({ideal: x0}),
      _1300: (x0,x1,x2) => ({width: x0,height: x1,deviceId: x2}),
      _1301: x0 => ({video: x0}),
      _1302: (x0,x1) => ({width: x0,height: x1}),
      _1303: (x0,x1,x2) => ({width: x0,height: x1,facingMode: x2}),
      _1304: (x0,x1) => x0.getUserMedia(x1),
      _1305: x0 => x0.getVideoTracks(),
      _1306: x0 => x0.getSettings(),
      _1307: (x0,x1) => x0.detect(x1),
      _1308: () => new BarcodeDetector(),
      _1309: x0 => ({formats: x0}),
      _1310: x0 => new BarcodeDetector(x0),
      _1311: () => new Map(),
      _1312: (x0,x1,x2) => x0.set(x1,x2),
      _1313: (x0,x1,x2,x3) => x0.call(x1,x2,x3),
      _1314: f => finalizeWrapper(f, function(x0,x1) { return dartInstance.exports._1314(f,arguments.length,x0,x1) }),
      _1315: (x0,x1) => new ZXing.BrowserMultiFormatReader(x0,x1),
      _1316: x0 => ({type: x0}),
      _1317: (x0,x1) => new Blob(x0,x1),
      _1318: x0 => globalThis.URL.createObjectURL(x0),
      _1320: (x0,x1) => x0.createElement(x1),
      _1321: (x0,x1,x2) => x0.setAttribute(x1,x2),
      _1325: x0 => x0.remove(),
      _1326: x0 => x0.click(),
      _1335: () => new FileReader(),
      _1336: (x0,x1) => x0.readAsArrayBuffer(x1),
      _1342: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      _1343: (x0,x1,x2,x3) => x0.removeEventListener(x1,x2,x3),
      _1345: (x0,x1) => x0.getAttribute(x1),
      _1349: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      _1350: (x0,x1) => x0.canShare(x1),
      _1351: (x0,x1) => x0.share(x1),
      _1353: (x0,x1,x2) => ({files: x0,title: x1,text: x2}),
      _1354: (x0,x1) => ({files: x0,text: x1}),
      _1355: (x0,x1) => ({files: x0,title: x1}),
      _1356: x0 => ({files: x0}),
      _1357: (x0,x1) => ({title: x0,text: x1}),
      _1358: x0 => ({text: x0}),
      _1359: () => ({}),
      _1360: (x0,x1,x2) => new File(x0,x1,x2),
      _1370: (x0,x1) => x0.item(x1),
      _1381: x0 => x0.toArray(),
      _1382: x0 => x0.toUint8Array(),
      _1383: x0 => ({serverTimestamps: x0}),
      _1384: x0 => ({source: x0}),
      _1385: x0 => ({merge: x0}),
      _1387: x0 => new firebase_firestore.FieldPath(x0),
      _1388: (x0,x1) => new firebase_firestore.FieldPath(x0,x1),
      _1389: (x0,x1,x2) => new firebase_firestore.FieldPath(x0,x1,x2),
      _1390: (x0,x1,x2,x3) => new firebase_firestore.FieldPath(x0,x1,x2,x3),
      _1391: (x0,x1,x2,x3,x4) => new firebase_firestore.FieldPath(x0,x1,x2,x3,x4),
      _1392: (x0,x1,x2,x3,x4,x5) => new firebase_firestore.FieldPath(x0,x1,x2,x3,x4,x5),
      _1393: (x0,x1,x2,x3,x4,x5,x6) => new firebase_firestore.FieldPath(x0,x1,x2,x3,x4,x5,x6),
      _1394: (x0,x1,x2,x3,x4,x5,x6,x7) => new firebase_firestore.FieldPath(x0,x1,x2,x3,x4,x5,x6,x7),
      _1395: (x0,x1,x2,x3,x4,x5,x6,x7,x8) => new firebase_firestore.FieldPath(x0,x1,x2,x3,x4,x5,x6,x7,x8),
      _1396: (x0,x1,x2,x3,x4,x5,x6,x7,x8,x9) => new firebase_firestore.FieldPath(x0,x1,x2,x3,x4,x5,x6,x7,x8,x9),
      _1397: () => globalThis.firebase_firestore.documentId(),
      _1398: (x0,x1) => new firebase_firestore.Timestamp(x0,x1),
      _1399: (x0,x1) => new firebase_firestore.GeoPoint(x0,x1),
      _1400: x0 => globalThis.firebase_firestore.vector(x0),
      _1401: x0 => globalThis.firebase_firestore.Bytes.fromUint8Array(x0),
      _1402: x0 => globalThis.firebase_firestore.writeBatch(x0),
      _1403: (x0,x1) => globalThis.firebase_firestore.collection(x0,x1),
      _1405: (x0,x1) => globalThis.firebase_firestore.doc(x0,x1),
      _1408: x0 => x0.call(),
      _1409: x0 => globalThis.firebase_firestore.clearIndexedDbPersistence(x0),
      _1410: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1410(f,arguments.length,x0) }),
      _1411: x0 => ({maxAttempts: x0}),
      _1412: (x0,x1,x2) => globalThis.firebase_firestore.runTransaction(x0,x1,x2),
      _1432: x0 => x0.commit(),
      _1433: (x0,x1) => x0.delete(x1),
      _1435: (x0,x1,x2) => x0.set(x1,x2),
      _1436: x0 => globalThis.firebase_firestore.deleteDoc(x0),
      _1437: x0 => globalThis.firebase_firestore.getDoc(x0),
      _1438: x0 => globalThis.firebase_firestore.getDocFromServer(x0),
      _1439: x0 => globalThis.firebase_firestore.getDocFromCache(x0),
      _1440: (x0,x1) => ({includeMetadataChanges: x0,source: x1}),
      _1441: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1441(f,arguments.length,x0) }),
      _1442: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1442(f,arguments.length,x0) }),
      _1443: (x0,x1,x2,x3) => globalThis.firebase_firestore.onSnapshot(x0,x1,x2,x3),
      _1444: (x0,x1,x2) => globalThis.firebase_firestore.onSnapshot(x0,x1,x2),
      _1445: (x0,x1,x2) => globalThis.firebase_firestore.setDoc(x0,x1,x2),
      _1446: (x0,x1) => globalThis.firebase_firestore.setDoc(x0,x1),
      _1447: (x0,x1) => globalThis.firebase_firestore.query(x0,x1),
      _1448: x0 => globalThis.firebase_firestore.getDocs(x0),
      _1449: x0 => globalThis.firebase_firestore.getDocsFromServer(x0),
      _1450: x0 => globalThis.firebase_firestore.getDocsFromCache(x0),
      _1451: x0 => globalThis.firebase_firestore.limit(x0),
      _1452: x0 => globalThis.firebase_firestore.limitToLast(x0),
      _1453: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1453(f,arguments.length,x0) }),
      _1454: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1454(f,arguments.length,x0) }),
      _1455: (x0,x1) => globalThis.firebase_firestore.orderBy(x0,x1),
      _1457: (x0,x1,x2) => globalThis.firebase_firestore.where(x0,x1,x2),
      _1459: x0 => globalThis.firebase_firestore.doc(x0),
      _1462: (x0,x1) => x0.data(x1),
      _1466: x0 => x0.docChanges(),
      _1469: (x0,x1) => x0.delete(x1),
      _1470: (x0,x1) => x0.get(x1),
      _1471: (x0,x1,x2,x3) => x0.set(x1,x2,x3),
      _1472: (x0,x1,x2) => x0.set(x1,x2),
      _1473: () => globalThis.firebase_firestore.deleteField(),
      _1474: () => globalThis.firebase_firestore.serverTimestamp(),
      _1475: x0 => globalThis.firebase_firestore.increment(x0),
      _1484: (x0,x1) => globalThis.firebase_firestore.getFirestore(x0,x1),
      _1486: f => finalizeWrapper(f, function() { return dartInstance.exports._1486(f,arguments.length) }),
      _1632: () => globalThis.firebase_firestore.updateDoc,
      _1633: () => globalThis.firebase_firestore.or,
      _1634: () => globalThis.firebase_firestore.and,
      _1649: x0 => x0.path,
      _1652: () => globalThis.firebase_firestore.GeoPoint,
      _1653: x0 => x0.latitude,
      _1654: x0 => x0.longitude,
      _1656: () => globalThis.firebase_firestore.VectorValue,
      _1657: () => globalThis.firebase_firestore.Bytes,
      _1660: x0 => x0.type,
      _1662: x0 => x0.doc,
      _1664: x0 => x0.oldIndex,
      _1666: x0 => x0.newIndex,
      _1668: () => globalThis.firebase_firestore.DocumentReference,
      _1672: x0 => x0.path,
      _1681: x0 => x0.metadata,
      _1682: x0 => x0.ref,
      _1687: x0 => x0.docs,
      _1689: x0 => x0.metadata,
      _1694: () => globalThis.firebase_firestore.Timestamp,
      _1695: x0 => x0.seconds,
      _1696: x0 => x0.nanoseconds,
      _1732: x0 => x0.hasPendingWrites,
      _1734: x0 => x0.fromCache,
      _1741: x0 => x0.source,
      _1746: () => globalThis.firebase_firestore.startAfter,
      _1747: () => globalThis.firebase_firestore.startAt,
      _1748: () => globalThis.firebase_firestore.endBefore,
      _1749: () => globalThis.firebase_firestore.endAt,
      _1750: () => globalThis.firebase_firestore.arrayRemove,
      _1751: () => globalThis.firebase_firestore.arrayUnion,
      _1790: x0 => globalThis.Wakelock.toggle(x0),
      _1792: x0 => x0.delete(),
      _1798: (x0,x1) => globalThis.firebase_auth.reauthenticateWithCredential(x0,x1),
      _1812: x0 => x0.toJSON(),
      _1813: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1813(f,arguments.length,x0) }),
      _1814: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1814(f,arguments.length,x0) }),
      _1815: (x0,x1,x2) => x0.onAuthStateChanged(x1,x2),
      _1816: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1816(f,arguments.length,x0) }),
      _1817: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1817(f,arguments.length,x0) }),
      _1818: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1818(f,arguments.length,x0) }),
      _1819: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1819(f,arguments.length,x0) }),
      _1820: (x0,x1,x2) => x0.onIdTokenChanged(x1,x2),
      _1824: (x0,x1,x2) => globalThis.firebase_auth.createUserWithEmailAndPassword(x0,x1,x2),
      _1830: (x0,x1,x2) => globalThis.firebase_auth.sendPasswordResetEmail(x0,x1,x2),
      _1831: (x0,x1) => globalThis.firebase_auth.signInWithCredential(x0,x1),
      _1834: (x0,x1,x2) => globalThis.firebase_auth.signInWithEmailAndPassword(x0,x1,x2),
      _1839: x0 => x0.signOut(),
      _1840: (x0,x1) => globalThis.firebase_auth.connectAuthEmulator(x0,x1),
      _1845: (x0,x1) => globalThis.firebase_auth.EmailAuthProvider.credential(x0,x1),
      _1858: (x0,x1) => globalThis.firebase_auth.GoogleAuthProvider.credential(x0,x1),
      _1859: x0 => new firebase_auth.OAuthProvider(x0),
      _1862: (x0,x1) => x0.credential(x1),
      _1863: x0 => globalThis.firebase_auth.OAuthProvider.credentialFromResult(x0),
      _1878: x0 => globalThis.firebase_auth.getAdditionalUserInfo(x0),
      _1879: (x0,x1,x2) => ({errorMap: x0,persistence: x1,popupRedirectResolver: x2}),
      _1880: (x0,x1) => globalThis.firebase_auth.initializeAuth(x0,x1),
      _1881: (x0,x1,x2) => ({accessToken: x0,idToken: x1,rawNonce: x2}),
      _1886: x0 => globalThis.firebase_auth.OAuthProvider.credentialFromError(x0),
      _1901: () => globalThis.firebase_auth.debugErrorMap,
      _1904: () => globalThis.firebase_auth.browserSessionPersistence,
      _1906: () => globalThis.firebase_auth.browserLocalPersistence,
      _1908: () => globalThis.firebase_auth.indexedDBLocalPersistence,
      _1911: x0 => globalThis.firebase_auth.multiFactor(x0),
      _1912: (x0,x1) => globalThis.firebase_auth.getMultiFactorResolver(x0,x1),
      _1914: x0 => x0.currentUser,
      _1918: x0 => x0.tenantId,
      _1928: x0 => x0.displayName,
      _1929: x0 => x0.email,
      _1930: x0 => x0.phoneNumber,
      _1931: x0 => x0.photoURL,
      _1932: x0 => x0.providerId,
      _1933: x0 => x0.uid,
      _1934: x0 => x0.emailVerified,
      _1935: x0 => x0.isAnonymous,
      _1936: x0 => x0.providerData,
      _1937: x0 => x0.refreshToken,
      _1938: x0 => x0.tenantId,
      _1939: x0 => x0.metadata,
      _1941: x0 => x0.providerId,
      _1942: x0 => x0.signInMethod,
      _1943: x0 => x0.accessToken,
      _1944: x0 => x0.idToken,
      _1945: x0 => x0.secret,
      _1957: x0 => x0.creationTime,
      _1958: x0 => x0.lastSignInTime,
      _1963: x0 => x0.code,
      _1965: x0 => x0.message,
      _1977: x0 => x0.email,
      _1978: x0 => x0.phoneNumber,
      _1979: x0 => x0.tenantId,
      _2002: x0 => x0.user,
      _2005: x0 => x0.providerId,
      _2006: x0 => x0.profile,
      _2007: x0 => x0.username,
      _2008: x0 => x0.isNewUser,
      _2011: () => globalThis.firebase_auth.browserPopupRedirectResolver,
      _2016: x0 => x0.displayName,
      _2017: x0 => x0.enrollmentTime,
      _2018: x0 => x0.factorId,
      _2019: x0 => x0.uid,
      _2021: x0 => x0.hints,
      _2022: x0 => x0.session,
      _2024: x0 => x0.phoneNumber,
      _2036: (x0,x1) => x0.getItem(x1),
      _2041: () => new AudioContext(),
      _2042: (x0,x1) => x0.createMediaElementSource(x1),
      _2043: x0 => x0.createGain(),
      _2044: x0 => x0.createStereoPanner(),
      _2045: (x0,x1) => x0.connect(x1),
      _2046: x0 => x0.load(),
      _2047: x0 => x0.disconnect(),
      _2048: x0 => x0.resume(),
      _2049: x0 => x0.close(),
      _2050: (x0,x1) => x0.removeItem(x1),
      _2051: (x0,x1,x2) => x0.setItem(x1,x2),
      _2052: x0 => ({name: x0}),
      _2053: (x0,x1) => x0.query(x1),
      _2054: x0 => ({audio: x0}),
      _2055: x0 => x0.getAudioTracks(),
      _2056: x0 => x0.stop(),
      _2057: () => globalThis.Notification.requestPermission(),
      _2058: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._2058(f,arguments.length,x0) }),
      _2059: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._2059(f,arguments.length,x0) }),
      _2060: (x0,x1,x2) => x0.getCurrentPosition(x1,x2),
      _2064: (x0,x1,x2,x3,x4,x5,x6,x7) => ({apiKey: x0,authDomain: x1,databaseURL: x2,projectId: x3,storageBucket: x4,messagingSenderId: x5,measurementId: x6,appId: x7}),
      _2066: x0 => globalThis.firebase_core.initializeApp(x0),
      _2067: x0 => globalThis.firebase_core.getApp(x0),
      _2068: () => globalThis.firebase_core.getApp(),
      _2069: (x0,x1,x2) => globalThis.firebase_core.registerVersion(x0,x1,x2),
      _2071: () => globalThis.firebase_core.SDK_VERSION,
      _2077: x0 => x0.apiKey,
      _2079: x0 => x0.authDomain,
      _2081: x0 => x0.databaseURL,
      _2083: x0 => x0.projectId,
      _2085: x0 => x0.storageBucket,
      _2087: x0 => x0.messagingSenderId,
      _2089: x0 => x0.measurementId,
      _2091: x0 => x0.appId,
      _2093: x0 => x0.name,
      _2094: x0 => x0.options,
      _2095: (x0,x1) => x0.debug(x1),
      _2096: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._2096(f,arguments.length,x0) }),
      _2097: f => finalizeWrapper(f, function(x0,x1) { return dartInstance.exports._2097(f,arguments.length,x0,x1) }),
      _2098: (x0,x1) => ({createScript: x0,createScriptURL: x1}),
      _2099: (x0,x1,x2) => x0.createPolicy(x1,x2),
      _2100: (x0,x1) => x0.createScriptURL(x1),
      _2101: (x0,x1,x2) => x0.createScript(x1,x2),
      _2102: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._2102(f,arguments.length,x0) }),
      _2103: () => globalThis.removeSplashFromWeb(),
      _2105: (x0,x1) => x0.initialize(x1),
      _2109: x0 => x0.disableAutoSelect(),
      _2110: () => globalThis.ZXingWASM,
      _2111: x0 => x0.text,
      _2112: x0 => x0.format,
      _2113: x0 => x0.bytes,
      _2114: x0 => x0.position,
      _2115: x0 => x0.isValid,
      _2116: x0 => x0.topLeft,
      _2117: x0 => x0.topRight,
      _2118: x0 => x0.bottomRight,
      _2119: x0 => x0.bottomLeft,
      _2120: x0 => x0.x,
      _2121: x0 => x0.y,
      _2122: x0 => x0.barcodeFormat,
      _2123: x0 => x0.text,
      _2124: x0 => x0.rawBytes,
      _2125: x0 => x0.resultPoints,
      _2127: Date.now,
      _2129: s => new Date(s * 1000).getTimezoneOffset() * 60,
      _2130: s => {
        if (!/^\s*[+-]?(?:Infinity|NaN|(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][+-]?\d+)?)\s*$/.test(s)) {
          return NaN;
        }
        return parseFloat(s);
      },
      _2131: () => {
        let stackString = new Error().stack.toString();
        let frames = stackString.split('\n');
        let drop = 2;
        if (frames[0] === 'Error') {
            drop += 1;
        }
        return frames.slice(drop).join('\n');
      },
      _2132: () => typeof dartUseDateNowForTicks !== "undefined",
      _2133: () => 1000 * performance.now(),
      _2134: () => Date.now(),
      _2135: () => {
        // On browsers return `globalThis.location.href`
        if (globalThis.location != null) {
          return globalThis.location.href;
        }
        return null;
      },
      _2136: () => {
        return typeof process != "undefined" &&
               Object.prototype.toString.call(process) == "[object process]" &&
               process.platform == "win32"
      },
      _2137: () => new WeakMap(),
      _2138: (map, o) => map.get(o),
      _2139: (map, o, v) => map.set(o, v),
      _2140: x0 => new WeakRef(x0),
      _2141: x0 => x0.deref(),
      _2148: () => globalThis.WeakRef,
      _2151: s => JSON.stringify(s),
      _2152: s => printToConsole(s),
      _2153: (o, p, r) => o.replaceAll(p, () => r),
      _2154: (o, p, r) => o.replace(p, () => r),
      _2155: Function.prototype.call.bind(String.prototype.toLowerCase),
      _2156: s => s.toUpperCase(),
      _2157: s => s.trim(),
      _2158: s => s.trimLeft(),
      _2159: s => s.trimRight(),
      _2160: (string, times) => string.repeat(times),
      _2161: Function.prototype.call.bind(String.prototype.indexOf),
      _2162: (s, p, i) => s.lastIndexOf(p, i),
      _2163: (string, token) => string.split(token),
      _2164: Object.is,
      _2165: o => o instanceof Array,
      _2166: (a, i) => a.push(i),
      _2169: (a, l) => a.length = l,
      _2170: a => a.pop(),
      _2171: (a, i) => a.splice(i, 1),
      _2172: (a, s) => a.join(s),
      _2173: (a, s, e) => a.slice(s, e),
      _2174: (a, s, e) => a.splice(s, e),
      _2175: (a, b) => a == b ? 0 : (a > b ? 1 : -1),
      _2176: a => a.length,
      _2177: (a, l) => a.length = l,
      _2178: (a, i) => a[i],
      _2179: (a, i, v) => a[i] = v,
      _2181: o => {
        if (o instanceof ArrayBuffer) return 0;
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
          return 1;
        }
        return 2;
      },
      _2182: (o, offsetInBytes, lengthInBytes) => {
        var dst = new ArrayBuffer(lengthInBytes);
        new Uint8Array(dst).set(new Uint8Array(o, offsetInBytes, lengthInBytes));
        return new DataView(dst);
      },
      _2184: o => o instanceof Uint8Array,
      _2185: (o, start, length) => new Uint8Array(o.buffer, o.byteOffset + start, length),
      _2186: o => o instanceof Int8Array,
      _2187: (o, start, length) => new Int8Array(o.buffer, o.byteOffset + start, length),
      _2188: o => o instanceof Uint8ClampedArray,
      _2189: (o, start, length) => new Uint8ClampedArray(o.buffer, o.byteOffset + start, length),
      _2190: o => o instanceof Uint16Array,
      _2191: (o, start, length) => new Uint16Array(o.buffer, o.byteOffset + start, length),
      _2192: o => o instanceof Int16Array,
      _2193: (o, start, length) => new Int16Array(o.buffer, o.byteOffset + start, length),
      _2194: o => o instanceof Uint32Array,
      _2195: (o, start, length) => new Uint32Array(o.buffer, o.byteOffset + start, length),
      _2196: o => o instanceof Int32Array,
      _2197: (o, start, length) => new Int32Array(o.buffer, o.byteOffset + start, length),
      _2199: (o, start, length) => new BigInt64Array(o.buffer, o.byteOffset + start, length),
      _2200: o => o instanceof Float32Array,
      _2201: (o, start, length) => new Float32Array(o.buffer, o.byteOffset + start, length),
      _2202: o => o instanceof Float64Array,
      _2203: (o, start, length) => new Float64Array(o.buffer, o.byteOffset + start, length),
      _2204: (t, s) => t.set(s),
      _2205: l => new DataView(new ArrayBuffer(l)),
      _2206: (o) => new DataView(o.buffer, o.byteOffset, o.byteLength),
      _2207: o => o.byteLength,
      _2208: o => o.buffer,
      _2209: o => o.byteOffset,
      _2210: Function.prototype.call.bind(Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get),
      _2211: (b, o) => new DataView(b, o),
      _2212: (b, o, l) => new DataView(b, o, l),
      _2213: Function.prototype.call.bind(DataView.prototype.getUint8),
      _2214: Function.prototype.call.bind(DataView.prototype.setUint8),
      _2215: Function.prototype.call.bind(DataView.prototype.getInt8),
      _2216: Function.prototype.call.bind(DataView.prototype.setInt8),
      _2217: Function.prototype.call.bind(DataView.prototype.getUint16),
      _2218: Function.prototype.call.bind(DataView.prototype.setUint16),
      _2219: Function.prototype.call.bind(DataView.prototype.getInt16),
      _2220: Function.prototype.call.bind(DataView.prototype.setInt16),
      _2221: Function.prototype.call.bind(DataView.prototype.getUint32),
      _2222: Function.prototype.call.bind(DataView.prototype.setUint32),
      _2223: Function.prototype.call.bind(DataView.prototype.getInt32),
      _2224: Function.prototype.call.bind(DataView.prototype.setInt32),
      _2227: Function.prototype.call.bind(DataView.prototype.getBigInt64),
      _2228: Function.prototype.call.bind(DataView.prototype.setBigInt64),
      _2229: Function.prototype.call.bind(DataView.prototype.getFloat32),
      _2230: Function.prototype.call.bind(DataView.prototype.setFloat32),
      _2231: Function.prototype.call.bind(DataView.prototype.getFloat64),
      _2232: Function.prototype.call.bind(DataView.prototype.setFloat64),
      _2245: (ms, c) =>
      setTimeout(() => dartInstance.exports.$invokeCallback(c),ms),
      _2246: (handle) => clearTimeout(handle),
      _2247: (ms, c) =>
      setInterval(() => dartInstance.exports.$invokeCallback(c), ms),
      _2248: (handle) => clearInterval(handle),
      _2249: (c) =>
      queueMicrotask(() => dartInstance.exports.$invokeCallback(c)),
      _2250: () => Date.now(),
      _2255: o => Object.keys(o),
      _2257: () => new XMLHttpRequest(),
      _2258: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      _2259: x0 => x0.send(),
      _2261: (x0,x1) => x0.item(x1),
      _2262: () => new AbortController(),
      _2263: x0 => x0.abort(),
      _2264: (x0,x1,x2,x3,x4,x5) => ({method: x0,headers: x1,body: x2,credentials: x3,redirect: x4,signal: x5}),
      _2265: (x0,x1) => globalThis.fetch(x0,x1),
      _2266: (x0,x1) => x0.get(x1),
      _2267: f => finalizeWrapper(f, function(x0,x1,x2) { return dartInstance.exports._2267(f,arguments.length,x0,x1,x2) }),
      _2268: (x0,x1) => x0.forEach(x1),
      _2269: x0 => x0.getReader(),
      _2270: x0 => x0.cancel(),
      _2271: x0 => x0.read(),
      _2276: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._2276(f,arguments.length,x0) }),
      _2277: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._2277(f,arguments.length,x0) }),
      _2282: x0 => x0.trustedTypes,
      _2283: (x0,x1) => { x0.src = x1 },
      _2284: (x0,x1) => x0.createScriptURL(x1),
      _2285: x0 => x0.nonce,
      _2286: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._2286(f,arguments.length,x0) }),
      _2287: x0 => ({createScriptURL: x0}),
      _2288: (x0,x1) => x0.querySelectorAll(x1),
      _2289: x0 => x0.attachStreamToVideo,
      _2291: x0 => x0.decodeContinuously,
      _2295: x0 => x0.reset,
      _2297: x0 => x0.stopContinuousDecode,
      _2299: x0 => x0.stream,
      _2300: x0 => x0.videoElement,
      _2301: () => globalThis.BarcodeDetector.getSupportedFormats(),
      _2302: x0 => x0.rawValue,
      _2303: x0 => x0.format,
      _2304: x0 => x0.cornerPoints,
      _2305: x0 => x0.x,
      _2306: x0 => x0.y,
      _2307: f => finalizeWrapper(f, function(x0,x1) { return dartInstance.exports._2307(f,arguments.length,x0,x1) }),
      _2308: (x0,x1) => x0.key(x1),
      _2321: x0 => x0.mediaDevices,
      _2323: x0 => x0.facingMode,
      _2324: x0 => x0.deviceId,
      _2325: (x0,x1) => ({width: x0,height: x1}),
      _2326: (x0,x1,x2) => ({width: x0,height: x1,facingMode: x2}),
      _2327: x0 => x0.trustedTypes,
      _2328: (x0,x1) => { x0.text = x1 },
      _2336: (s, m) => {
        try {
          return new RegExp(s, m);
        } catch (e) {
          return String(e);
        }
      },
      _2337: (x0,x1) => x0.exec(x1),
      _2338: (x0,x1) => x0.test(x1),
      _2339: x0 => x0.pop(),
      _2341: o => o === undefined,
      _2343: o => typeof o === 'function' && o[jsWrappedDartFunctionSymbol] === true,
      _2345: o => {
        const proto = Object.getPrototypeOf(o);
        return proto === Object.prototype || proto === null;
      },
      _2346: o => o instanceof RegExp,
      _2347: (l, r) => l === r,
      _2348: o => o,
      _2349: o => o,
      _2350: o => o,
      _2351: b => !!b,
      _2352: o => o.length,
      _2354: (o, i) => o[i],
      _2355: f => f.dartFunction,
      _2356: () => ({}),
      _2357: () => [],
      _2359: () => globalThis,
      _2360: (constructor, args) => {
        const factoryFunction = constructor.bind.apply(
            constructor, [null, ...args]);
        return new factoryFunction();
      },
      _2361: (o, p) => p in o,
      _2362: (o, p) => o[p],
      _2363: (o, p, v) => o[p] = v,
      _2364: (o, m, a) => o[m].apply(o, a),
      _2366: o => String(o),
      _2367: (p, s, f) => p.then(s, (e) => f(e, e === undefined)),
      _2368: o => {
        if (o === undefined) return 1;
        var type = typeof o;
        if (type === 'boolean') return 2;
        if (type === 'number') return 3;
        if (type === 'string') return 4;
        if (o instanceof Array) return 5;
        if (ArrayBuffer.isView(o)) {
          if (o instanceof Int8Array) return 6;
          if (o instanceof Uint8Array) return 7;
          if (o instanceof Uint8ClampedArray) return 8;
          if (o instanceof Int16Array) return 9;
          if (o instanceof Uint16Array) return 10;
          if (o instanceof Int32Array) return 11;
          if (o instanceof Uint32Array) return 12;
          if (o instanceof Float32Array) return 13;
          if (o instanceof Float64Array) return 14;
          if (o instanceof DataView) return 15;
        }
        if (o instanceof ArrayBuffer) return 16;
        // Feature check for `SharedArrayBuffer` before doing a type-check.
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
            return 17;
        }
        return 18;
      },
      _2369: o => [o],
      _2370: (o0, o1) => [o0, o1],
      _2371: (o0, o1, o2) => [o0, o1, o2],
      _2372: (o0, o1, o2, o3) => [o0, o1, o2, o3],
      _2373: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI8ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _2374: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI8ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _2375: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI16ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _2376: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI16ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _2377: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _2378: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _2379: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _2380: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _2381: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF64ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _2382: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF64ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _2383: x0 => new ArrayBuffer(x0),
      _2384: s => {
        if (/[[\]{}()*+?.\\^$|]/.test(s)) {
            s = s.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
        }
        return s;
      },
      _2386: x0 => x0.index,
      _2387: x0 => x0.groups,
      _2388: x0 => x0.flags,
      _2389: x0 => x0.multiline,
      _2390: x0 => x0.ignoreCase,
      _2391: x0 => x0.unicode,
      _2392: x0 => x0.dotAll,
      _2393: (x0,x1) => { x0.lastIndex = x1 },
      _2394: (o, p) => p in o,
      _2395: (o, p) => o[p],
      _2396: (o, p, v) => o[p] = v,
      _2397: (o, p) => delete o[p],
      _2398: x0 => x0.random(),
      _2399: (x0,x1) => x0.getRandomValues(x1),
      _2400: () => globalThis.crypto,
      _2401: () => globalThis.Math,
      _2402: Function.prototype.call.bind(Number.prototype.toString),
      _2403: Function.prototype.call.bind(BigInt.prototype.toString),
      _2404: Function.prototype.call.bind(Number.prototype.toString),
      _2405: (d, digits) => d.toFixed(digits),
      _2452: x0 => x0.x,
      _2453: x0 => x0.y,
      _2489: () => globalThis.google.accounts.id,
      _2503: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._2503(f,arguments.length,x0) }),
      _2506: (x0,x1,x2,x3,x4,x5,x6,x7,x8,x9,x10,x11,x12,x13,x14,x15,x16) => ({client_id: x0,auto_select: x1,callback: x2,login_uri: x3,native_callback: x4,cancel_on_tap_outside: x5,prompt_parent_id: x6,nonce: x7,context: x8,state_cookie_domain: x9,ux_mode: x10,allowed_parent_origin: x11,intermediate_iframe_close_callback: x12,itp_support: x13,login_hint: x14,hd: x15,use_fedcm_for_prompt: x16}),
      _2517: x0 => x0.error,
      _2519: x0 => x0.credential,
      _2530: x0 => { globalThis.onGoogleLibraryLoad = x0 },
      _2531: f => finalizeWrapper(f, function() { return dartInstance.exports._2531(f,arguments.length) }),
      _2580: (x0,x1) => { x0.responseType = x1 },
      _2581: x0 => x0.response,
      _2628: (x0,x1) => { x0.lang = x1 },
      _2657: x0 => x0.style,
      _2716: (x0,x1) => { x0.onerror = x1 },
      _2732: (x0,x1) => { x0.onload = x1 },
      _2756: (x0,x1) => { x0.onpause = x1 },
      _2758: (x0,x1) => { x0.onplay = x1 },
      _2856: (x0,x1) => { x0.nonce = x1 },
      _3016: (x0,x1) => { x0.download = x1 },
      _3041: (x0,x1) => { x0.href = x1 },
      _3229: x0 => x0.videoWidth,
      _3230: x0 => x0.videoHeight,
      _3260: x0 => x0.error,
      _3262: (x0,x1) => { x0.src = x1 },
      _3264: (x0,x1) => { x0.srcObject = x1 },
      _3267: (x0,x1) => { x0.crossOrigin = x1 },
      _3270: (x0,x1) => { x0.preload = x1 },
      _3274: x0 => x0.currentTime,
      _3275: (x0,x1) => { x0.currentTime = x1 },
      _3276: x0 => x0.duration,
      _3277: x0 => x0.paused,
      _3281: (x0,x1) => { x0.playbackRate = x1 },
      _3290: (x0,x1) => { x0.loop = x1 },
      _3292: (x0,x1) => { x0.controls = x1 },
      _3311: x0 => x0.code,
      _3312: x0 => x0.message,
      _3890: x0 => x0.src,
      _3891: (x0,x1) => { x0.src = x1 },
      _3893: (x0,x1) => { x0.type = x1 },
      _3897: (x0,x1) => { x0.async = x1 },
      _3899: (x0,x1) => { x0.defer = x1 },
      _3901: (x0,x1) => { x0.crossOrigin = x1 },
      _3903: (x0,x1) => { x0.text = x1 },
      _3911: (x0,x1) => { x0.charset = x1 },
      _3936: x0 => x0.width,
      _3937: (x0,x1) => { x0.width = x1 },
      _3938: x0 => x0.height,
      _3939: (x0,x1) => { x0.height = x1 },
      _4360: () => globalThis.window,
      _4400: x0 => x0.document,
      _4403: x0 => x0.location,
      _4422: x0 => x0.navigator,
      _4684: x0 => x0.trustedTypes,
      _4685: x0 => x0.sessionStorage,
      _4686: x0 => x0.localStorage,
      _4701: x0 => x0.hostname,
      _4790: x0 => x0.geolocation,
      _4793: x0 => x0.mediaDevices,
      _4795: x0 => x0.permissions,
      _4809: x0 => x0.userAgent,
      _4810: x0 => x0.vendor,
      _5017: x0 => x0.length,
      _6404: x0 => x0.destination,
      _6408: x0 => x0.state,
      _6499: (x0,x1) => { x0.value = x1 },
      _6648: x0 => x0.gain,
      _6916: x0 => x0.type,
      _6957: x0 => x0.signal,
      _6966: x0 => x0.length,
      _6968: x0 => x0.length,
      _7008: x0 => x0.baseURI,
      _7025: () => globalThis.document,
      _7105: x0 => x0.body,
      _7107: x0 => x0.head,
      _7437: (x0,x1) => { x0.id = x1 },
      _7464: x0 => x0.children,
      _8783: x0 => x0.value,
      _8785: x0 => x0.done,
      _8969: (x0,x1) => { x0.type = x1 },
      _8985: x0 => x0.result,
      _9482: x0 => x0.url,
      _9484: x0 => x0.status,
      _9486: x0 => x0.statusText,
      _9487: x0 => x0.headers,
      _9488: x0 => x0.body,
      _9873: x0 => x0.state,
      _10274: x0 => x0.active,
      _10305: x0 => x0.facingMode,
      _10402: x0 => x0.whiteBalanceMode,
      _10404: x0 => x0.exposureMode,
      _10406: x0 => x0.focusMode,
      _10475: (x0,x1) => { x0.whiteBalanceMode = x1 },
      _10477: (x0,x1) => { x0.exposureMode = x1 },
      _10479: (x0,x1) => { x0.focusMode = x1 },
      _10519: x0 => x0.width,
      _10521: x0 => x0.height,
      _10527: x0 => x0.facingMode,
      _10604: x0 => x0.deviceId,
      _10605: x0 => x0.kind,
      _11882: (x0,x1) => { x0.display = x1 },
      _12046: (x0,x1) => { x0.height = x1 },
      _12240: (x0,x1) => { x0.objectFit = x1 },
      _12370: (x0,x1) => { x0.pointerEvents = x1 },
      _12668: (x0,x1) => { x0.transform = x1 },
      _12672: (x0,x1) => { x0.transformOrigin = x1 },
      _12736: (x0,x1) => { x0.width = x1 },
      _13104: x0 => x0.name,
      _13105: x0 => x0.message,
      _13821: () => globalThis.console,
      _13848: x0 => x0.message,
      _13850: x0 => x0.name,
      _13851: x0 => x0.message,
      _13852: x0 => x0.code,
      _13854: x0 => x0.customData,

    };

    const baseImports = {
      dart2wasm: dart2wasm,
      Math: Math,
      Date: Date,
      Object: Object,
      Array: Array,
      Reflect: Reflect,
      S: new Proxy({}, { get(_, prop) { return prop; } }),

    };

    const jsStringPolyfill = {
      "charCodeAt": (s, i) => s.charCodeAt(i),
      "compare": (s1, s2) => {
        if (s1 < s2) return -1;
        if (s1 > s2) return 1;
        return 0;
      },
      "concat": (s1, s2) => s1 + s2,
      "equals": (s1, s2) => s1 === s2,
      "fromCharCode": (i) => String.fromCharCode(i),
      "length": (s) => s.length,
      "substring": (s, a, b) => s.substring(a, b),
      "fromCharCodeArray": (a, start, end) => {
        if (end <= start) return '';

        const read = dartInstance.exports.$wasmI16ArrayGet;
        let result = '';
        let index = start;
        const chunkLength = Math.min(end - index, 500);
        let array = new Array(chunkLength);
        while (index < end) {
          const newChunkLength = Math.min(end - index, 500);
          for (let i = 0; i < newChunkLength; i++) {
            array[i] = read(a, index++);
          }
          if (newChunkLength < chunkLength) {
            array = array.slice(0, newChunkLength);
          }
          result += String.fromCharCode(...array);
        }
        return result;
      },
      "intoCharCodeArray": (s, a, start) => {
        if (s === '') return 0;

        const write = dartInstance.exports.$wasmI16ArraySet;
        for (var i = 0; i < s.length; ++i) {
          write(a, start++, s.charCodeAt(i));
        }
        return s.length;
      },
      "test": (s) => typeof s == "string",
    };


    

    dartInstance = await WebAssembly.instantiate(this.module, {
      ...baseImports,
      ...additionalImports,
      
      "wasm:js-string": jsStringPolyfill,
    });

    return new InstantiatedApp(this, dartInstance);
  }
}

class InstantiatedApp {
  constructor(compiledApp, instantiatedModule) {
    this.compiledApp = compiledApp;
    this.instantiatedModule = instantiatedModule;
  }

  // Call the main function with the given arguments.
  invokeMain(...args) {
    this.instantiatedModule.exports.$invokeMain(args);
  }
}
