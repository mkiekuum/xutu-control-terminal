using System;
using System.IO;
using System.Diagnostics;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using System.Collections.Generic;
class XutuNativeHost {
 static int Main() {
  try {
   var directory=Path.GetDirectoryName(System.Reflection.Assembly.GetExecutingAssembly().Location);
   var config=new JavaScriptSerializer().Deserialize<Dictionary<string,string>>(File.ReadAllText(Path.Combine(directory,"launcher.json")));
   var start=new ProcessStartInfo(config["node"],"\""+config["script"].Replace("\"","")+"\" --host");
   start.UseShellExecute=false;start.CreateNoWindow=true;start.RedirectStandardInput=true;start.RedirectStandardOutput=true;start.RedirectStandardError=true;
   using(var child=Process.Start(start)){
    var toNode=Task.Run(async()=>{try{await Console.OpenStandardInput().CopyToAsync(child.StandardInput.BaseStream);child.StandardInput.Close();}catch{}});
    var fromNode=child.StandardOutput.BaseStream.CopyToAsync(Console.OpenStandardOutput());
    var errors=child.StandardError.BaseStream.CopyToAsync(Console.OpenStandardError());
    child.WaitForExit();fromNode.Wait();errors.Wait();return child.ExitCode;
   }
  }catch(Exception e){Console.Error.WriteLine("XUTU_LAUNCH_FAILED: "+e.GetType().Name);return 1;}
 }
}
