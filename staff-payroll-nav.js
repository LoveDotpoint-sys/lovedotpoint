/* Owner/Waiter extra navigation — Salary + Customer Pending */
(function(){
 const baseNavs=window.navs,baseRender=window.render,baseGo=window.go;
 window.navs=function(){
   const n=baseNavs();
   if(me&&me.role==='owner'){
     if(!n.some(x=>x[0]==='customerledger')){const at=n.findIndex(x=>x[0]==='menumanager');n.splice(at<0?n.length:at,0,['customerledger','Customer Pending'])}
     if(!n.some(x=>x[0]==='payroll')){const at=n.findIndex(x=>x[0]==='menumanager');n.splice(at<0?n.length:at,0,['payroll','Salary & Leave'])}
   }else if(me&&me.role==='waiter'&&!n.some(x=>x[0]==='payroll')) n.push(['payroll','Salary & Leave']);
   return n
 };
 window.go=function(v){
   if(v==='customerledger'&&me&&me.role==='owner'){view='customerledger';window.scrollTo({top:0,behavior:'smooth'});renderNav();return renderCustomerLedger()}
   if(v==='payroll'&&me&&['owner','waiter'].includes(me.role)){view='payroll';window.scrollTo({top:0,behavior:'smooth'});renderNav();return renderPayroll()}
   return baseGo(v)
 };
 window.render=function(){
   if(view==='customerledger'&&me&&me.role==='owner')return renderCustomerLedger();
   if(view==='payroll'&&me&&['owner','waiter'].includes(me.role))return renderPayroll();
   return baseRender()
 };
})();