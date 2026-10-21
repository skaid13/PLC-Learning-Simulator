import AppKit
let target = CommandLine.arguments[1]
try FileManager.default.createDirectory(atPath:target,withIntermediateDirectories:true)
for n in [16,32,64,128,256,512,1024] {
 let rep=NSBitmapImageRep(bitmapDataPlanes:nil,pixelsWide:n,pixelsHigh:n,bitsPerSample:8,samplesPerPixel:4,hasAlpha:true,isPlanar:false,colorSpaceName:.deviceRGB,bytesPerRow:0,bitsPerPixel:0)!
 NSGraphicsContext.saveGraphicsState(); NSGraphicsContext.current=NSGraphicsContext(bitmapImageRep:rep)
 let scale=CGFloat(n)/1024; let t=NSAffineTransform(); t.scale(by:scale); t.concat()
 NSColor(calibratedRed:0.145,green:0.388,blue:0.922,alpha:1).setFill()
 NSBezierPath(roundedRect:NSRect(x:32,y:32,width:960,height:960),xRadius:200,yRadius:200).fill()
 NSColor.white.setStroke(); let line=NSBezierPath();line.lineWidth=42;line.lineCapStyle = .round
 for (x1,y1,x2,y2) in [(180,512,390,512),(390,330,390,694),(634,330,634,694),(634,512,844,512)] {line.move(to:NSPoint(x:x1,y:y1));line.line(to:NSPoint(x:x2,y:y2))};line.stroke()
 let attrs:[NSAttributedString.Key:Any]=[.font:NSFont.systemFont(ofSize:104,weight:.semibold),.foregroundColor:NSColor.white]
 ("PLC" as NSString).draw(at:NSPoint(x:410,y:160),withAttributes:attrs)
 NSGraphicsContext.restoreGraphicsState()
 try rep.representation(using:.png,properties:[:])!.write(to:URL(fileURLWithPath:target+"/icon-\(n).png"))
}
