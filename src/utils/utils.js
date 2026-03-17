function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getOtpHTML(otp) {
  return `<!DOCTYPE html>
 <html>
 <head>
   <meta charset="UTF-8">
   <title>OTP Verification</title>
 </head>
 <body style="margin:0; padding:0; background-color:#f4f4f4; font-family: Arial, sans-serif;">
   <table align="center" width="100%" cellpadding="0" cellspacing="0" style="padding:20px;">
     <tr>
       <td align="center">
         <table width="400" cellpadding="20" cellspacing="0" style="background:#ffffff; border-radius:8px; text-align:center;">
           
           <tr>
             <td>
               <h2 style="margin-bottom:10px;">OTP Verification</h2>
               <p style="margin:0;">Your OTP code is:</p>
 
               <div style="margin:20px 0; font-size:28px; font-weight:bold; letter-spacing:4px;">
                 ${otp}
               </div>
 
               <p style="color:#555;">This OTP is valid for a limited time.</p>
             </td>
           </tr>
 
         </table>
       </td>
     </tr>
   </table>
 </body>
 </html>`;
}

export { generateOtp, getOtpHTML };