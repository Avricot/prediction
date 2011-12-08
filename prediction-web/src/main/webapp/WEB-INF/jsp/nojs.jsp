<%@ taglib uri='http://java.sun.com/jsp/jstl/core' prefix='c'%>
<%@ taglib uri='http://java.sun.com/jsp/jstl/fmt' prefix='fmt'%>
<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
	<meta http-equiv="content-type" content="text/html; charset=ISO-8859-1" />
	<meta name="description" content="Prediction elections 2012">
	<title>Observatoire des Pr�sidentielles 2012</title>
	<link href="./resources/styles/default.css" rel="stylesheet" type="text/css" />
</head>
<body>
	<div id="container">
		<div id="contentNoJs">
			<h1>Si vous avez des probl�mes avec l'affichage graphique, voici une version texte simplifi� des donn�es :</h1>
			<h2>Informations sur les candidats :</h2>
			<h3>L�gende :</h3>
			la tendance : Repr�sente le r�sultat pr�visionnel des �lections de 2012, avec les donn�es du web<br />
			le buzz : Repr�sente de combien on parle de ce candidat<br />
			les avis n�gatifs : Repr�sente de combien on parle en mauvais termes de ce candidat<br />
			les avis positifs : Repr�sente de combien on parle en bon termes de ce candidat<br />
			les d�sinteress�s : Repr�sente � quel point les fran�ais ne s'interessent pas � ce candidat<br /><br />
			
			Tendances :
			<br />
			<c:forEach var='candidat' items='${candidats}'>
				<c:out value='${candidat.candidatName}'/> :
				<c:out value='${(candidat.report.tendance / maxTendance) * 100}'/>
				<br />
			</c:forEach>
			<br />
			<TABLE>
			  <CAPTION>Donn�es pour les elections de 2012</CAPTION>
			  <TR>
				 <TH>Date</TH>
				 <TH>Candidat</TH>
				 <TH>Tendance</TH>
				 <TH>Buzz</TH>
				 <TH>Avis n�gatifs</TH>
				 <TH>Avis positifs</TH>
				 <TH>D�sinteress�s</TH>
			  </TR>
			 <c:forEach var='report' items='${reports}'>
		  		<jsp:useBean id="newsDate" class="java.util.Date" />
			    <jsp:setProperty name="newsDate" property="time" value="${report.timestamp}" />
				<c:forEach var='candidat' items='${candidats}'>
				    <TD><fmt:formatDate pattern="dd/MM/yyyy" value="${newsDate}" /></TD>
					 <TD><c:out value='${candidat.candidatName}'/></TD>
					 <TD><c:out value='${report.candidats[candidat.candidatName].tendance}'/></TD>
					 <TD><c:out value='${report.candidats[candidat.candidatName].buzz}'/></TD>
					 <TD><c:out value='${report.candidats[candidat.candidatName].neg}'/></TD>
					 <TD><c:out value='${report.candidats[candidat.candidatName].pos}'/></TD>
					 <TD><c:out value='${report.candidats[candidat.candidatName].none}'/></TD>					 
				 </TR>
				 </c:forEach>
			</c:forEach>
			</TABLE> 
			<h2>Informations sur les themes, par candidat :</h2>
			<TABLE>
			  <CAPTION>Donn�es pour les elections de 2012</CAPTION>
			  <TR>
				 <TH>Date</TH>
				 <TH>Candidat</TH>
				 <TH>S�curit�</TH>
				 <TH>Europe</TH>
				 <TH>economie</TH>
				 <TH>Ecologie</TH>
				 <TH>Immigration</TH>
				 <TH>Social</TH>
			  </TR>
			 <c:forEach var='report' items='${reports}'>
					<c:forEach var='candidat' items='${candidats}'>
			  		<TR>
			    		<jsp:setProperty name="newsDate" property="time" value="${report.timestamp}" />
			    		<TH><fmt:formatDate pattern="dd/MM/yyyy" value="${newsDate}" /></TH>
						 <TD><c:out value='${candidat.candidatName}'/></TD>
						<c:forEach var='theme' items='${themes}'>
							 <TD><c:out value='${report.candidats[candidat.candidatName].themes[theme]}'/></TD>
						 </c:forEach>
				 </TR>
				 </c:forEach>
			</c:forEach>
			</TABLE>
		</div>
	</div>
</body> 
</html>

<script type="text/javascript">
  var _gaq = _gaq || [];
  _gaq.push(['_setAccount', 'UA-27563713-1']);
  _gaq.push(['_trackPageview']);

  (function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
  })();
</script>
