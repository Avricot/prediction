package com.avricot.prediction.newspop;

import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.inject.Inject;

import org.apache.log4j.Logger;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;

import com.avricot.prediction.model.candidat.Candidat;
import com.avricot.prediction.model.report.DailyReport;
import com.avricot.prediction.model.report.Report;
import com.avricot.prediction.repository.candidat.CandidatRespository;
import com.avricot.prediction.repository.report.ReportRespository;
import com.avricot.prediction.utils.DateUtils;

@Service
public class NewsPopularity {

	@Inject
	CandidatRespository candidatRespository;

	@Inject
	ReportRespository reportRepository;

	private List<Candidat> candidats;
	private Report report;

	private HashMap<Candidat, Integer> scoreMap;

	private static final String RSS_LEMONDE = "http://rss.lemonde.fr/c/205/f/3050/index.rss";
	private static final String RSS_20MINUTES = "http://flux.20minutes.fr/c/32497/f/479493/index.rss";
	private static final String RSS_LCI = "http://rss.feedsportal.com/c/32788/f/524037/index.rss";
	private static final String RSS_LEPARISIEN = "http://rss.leparisien.fr/leparisien/rss/une.xml";
	private static final String RSS_JDD = "http://rss.feedsportal.com/c/285/f/3637/index.rss";

	private static final String RSS_LEFIGARO = "http://rss.lefigaro.fr/lefigaro/laune";
	private static final String RSS_LIBERATION = "http://rss.liberation.fr/rss/9/";

	private static final String RSS_OUESTFRANCE = "http://www.ouest-france.fr/dma-rss_-Toutes-les-DMA-RSS_6346--fils-tous_filDMA.Htm#xtor=RSS-3003";

	private static Logger LOG = Logger.getLogger(NewsPopularity.class);

	public void run() throws ClassNotFoundException, IOException {
		candidats = candidatRespository.findAll();
		scoreMap = new HashMap<Candidat, Integer>();

		Date todayDate = DateUtils.getMidnightTimestampDate(new Date());
		report = reportRepository.findByTimestamp(DateUtils.getMidnightTimestamp(new Date()));

		/* Le Monde */
		LOG.info("Parsing du flux RSS du monde");
		HashMap<Candidat, Integer> currentNewspaper = parseRSSLeMondeType(RSS_LEMONDE, todayDate);
		addValuesToReport("Le Monde", currentNewspaper);

		/* 20 minutes */
		LOG.info("Parsing du flux RSS de 20 minutes");
		currentNewspaper = parseRSSLeMondeType(RSS_20MINUTES, todayDate);
		addValuesToReport("20 Minutes", currentNewspaper);

		/* LCI */
		LOG.info("Parsing du flux RSS de LCI");
		currentNewspaper = parseRSSLeMondeType(RSS_LCI, todayDate);
		addValuesToReport("LCI", currentNewspaper);

		/* Le Parisien */
		LOG.info("Parsing du flux RSS de Le Parisien");
		currentNewspaper = parseRSSLeMondeType(RSS_LEPARISIEN, todayDate);
		addValuesToReport("Le Parisien", currentNewspaper);

		/* Le Journal du Dimanche */
		LOG.info("Parsing du flux RSS de Le Journal du dimanche");
		currentNewspaper = parseRSSLeMondeType(RSS_JDD, todayDate);
		addValuesToReport("Le Journal Du Dimanche", currentNewspaper);

	}

	/**
	 * Permet de remplir les dailyreports
	 * 
	 * @param newspaper
	 * @param currentNewspaper
	 */
	private void addValuesToReport(String newspaper, HashMap<Candidat, Integer> currentNewspaper) {
		DailyReport dailyReport;

		// TODO SAVE

		if (report == null) {
			report = new Report(DateUtils.getMidnightTimestamp(new Date()));
		}
		if (report.getCandidats().isEmpty()) {
			dailyReport = new DailyReport();
		} else {
			// for (CandidatName key : report.getCandidats().keySet()) {
			// dailyReport = report.getCandidats().get(key)
			// }
		}
		for (Candidat keyNews : currentNewspaper.keySet()) {
			// if(key.toString().equalsIgnoreCase(keyNews.getCandidatName().toString()))
			// {

			// report.getCandidats().get(key).getRssResult().put(newspaper,
			// currentNewspaper.get(keyNews));
			// }
		}
		// }
	}

	/**
	 * Parse les flux RSS de type de celui du Monde (avec le lien dans <div
	 * class="entry">)
	 * 
	 * @param url
	 * @return
	 * @return
	 * @throws IOException
	 */
	private HashMap<Candidat, Integer> parseRSSLeMondeType(String url, Date todayDate) throws IOException {
		Document doc = Jsoup.connect(url).timeout(0).get();
		Elements items = doc.getElementsByTag("item");
		HashMap<Candidat, Integer> rssCounterMap = new HashMap<Candidat, Integer>();
		SimpleDateFormat sdf = new SimpleDateFormat("E, dd MMM yyyy HH:mm:ss z", Locale.US);
		for (Element item : items) {
			Date dateArticle = null;
			try {
				dateArticle = sdf.parse(item.getElementsByTag("pubdate").text());
			} catch (ParseException e) {
				LOG.error("Erreur dans la conversion d'une date RSS");
				e.printStackTrace();
			}

			/* Si l'article est paru dans la journée souhaitée */
			if (dateArticle.after(todayDate)) {
				Elements link = item.getElementsByTag("guid");
				Document article = Jsoup.connect(link.text()).timeout(0).get();
				parseForCandidatPopularity(article.body().text(), rssCounterMap);
			}
		}

		return rssCounterMap;
	}

	/**
	 * Permet de parcourir un article à la recherche de toutes les occurrences
	 * des noms des candidats
	 * 
	 * @param articleText
	 * @param candidats
	 */
	private void parseForCandidatPopularity(String articleText, HashMap<Candidat, Integer> rssCounterMap) {
		int counter = 0;
		int score;
		// HashMap<Candidat, Integer> rssCounterMap = new HashMap<Candidat,
		// Integer>();

		for (Candidat candidat : candidats) {
			counter = 0;
			counter = stringOccur(articleText.toLowerCase(), candidat.getCandidatName().toString().toLowerCase());
			if (counter != 0) {
				if (!scoreMap.containsKey(candidat)) {
					scoreMap.put(candidat, counter);
					rssCounterMap.put(candidat, counter);
				} else {
					score = scoreMap.get(candidat);
					scoreMap.put(candidat, counter + score);
					rssCounterMap.put(candidat, counter + score);
				}
			}
		}
	}

	/**
	 * Renvoie le nombre d'occurrences de la sous-chaine de caractères spécifiée
	 * dans la chaine de caractères spécifiée
	 * 
	 * @param text
	 *            chaine de caractères initiale
	 * @param string
	 *            sous-chaine de caractères dont le nombre d'occurrences doit
	 *            etre compté
	 * @return le nombre d'occurrences du pattern spécifié dans la chaine de
	 *         caractères spécifiée
	 */
	public static final int stringOccur(String text, String string) {
		return regexOccur(text, Pattern.quote(string));
	}

	/**
	 * Renvoie le nombre d'occurrences du pattern spécifié dans la chaine de
	 * caractères spécifiée
	 * 
	 * @param text
	 *            chaine de caractères initiale
	 * @param regex
	 *            expression régulière dont le nombre d'occurrences doit etre
	 *            compté
	 * @return le nombre d'occurrences du pattern spécifié dans la chaine de
	 *         caractères spécifiée
	 */
	public static final int regexOccur(String text, String regex) {
		Matcher matcher = Pattern.compile(regex).matcher(text);
		int occur = 0;
		while (matcher.find()) {
			occur++;
		}
		return occur;
	}

}
