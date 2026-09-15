/* Attach payroll module without changing core POS flows. */
(function(){
 const baseNavs=window.navs,baseRender=window.render,baseGo=window.go;
 window.navs=function(){const n=baseNavs();if(me&&me.role==='owner'){const at=n.findIndex(x=>x[0]==='menumanager');n.splice(at<0?n.length:at,0,['payroll','Salary & Leave'])}else if(me&&me.role==='waiter'){n.push(['payroll','Salary & Leave'])}return n};
 window.go=function(v){if(v==='payroll'&&me&&['owner','waiter'].includes(me.role)){view='payroll';window.scrollTo({top:0,behavior:'smooth'});renderNav();return renderPayroll()}return baseGo(v)};
 window.render=function(){if(view==='payroll'&&me&&['owner','waiter'].includes(me.role))return renderPayroll();return baseRender()};
})();