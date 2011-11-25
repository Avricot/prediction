import httplib
import urllib
import urllib2 
import re
import csv

from cookielib import CookieJar

class pyGTrends(object):
    """
    Google Trends API
    
    Recommended usage:
    
    from csv import DictReader
    r = pyGTrends(username, password)
    r.download_report(('pants', 'skirt'))
    d = DictReader(r.csv().split('\n'))
    """
    def __init__(self, username, password):
        """
        provide login and password to be used to connect to Google Analytics
        all immutable system variables are also defined here
        website_id is the ID of the specific site on google analytics
        """        
        self.login_params = {
            "continue": 'http://www.google.com/trends',
            "PersistentCookie": "yes",
            "Email": username,
            "Passwd": password,
        }
        self.headers = [("Referrer", "https://www.google.com/accounts/ServiceLoginBoxAuth"),
                        ("Content-type", "application/x-www-form-urlencoded"),
                        ('User-Agent', 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10.6; en-US; rv:1.9.0.14) Gecko/2009082706 Firefox/3.0.14'),
                        ("Accept", "text/plain")]
        self.url_ServiceLoginBoxAuth = 'https://www.google.com/accounts/ServiceLoginBoxAuth'
        self.url_Export = 'http://www.google.com/insights/search/overviewReport?'
        self.url_CookieCheck = 'https://www.google.com/accounts/CheckCookie?chtml=LoginDoneHtml'
        self.header_dictionary = {}
        self._connect()
        
    def _connect(self):
        """
        connect to Google Trends
        """
        
        self.cj = CookieJar()                            
        self.opener = urllib2.build_opener(urllib2.HTTPCookieProcessor(self.cj))
        self.opener.addheaders = self.headers
        
        galx = re.compile('<input type="hidden" name="GALX" value="(?P<galx>[a-zA-Z0-9_]+)">')
        
        resp = self.opener.open(self.url_ServiceLoginBoxAuth).read()
        m = galx.search(resp)
        if not m:
            raise Exception("Cannot parse GALX out of login page")
        self.login_params['GALX'] = m.group('galx')
        params = urllib.urlencode(self.login_params)
        self.opener.open(self.url_ServiceLoginBoxAuth, params)
        self.opener.open(self.url_CookieCheck)
    
    def download_report(self, keywords, date='today 3-m', geo='FR'):
        """
        download a specific report
        date, geo, geor, graph, sort, scale and sa
        are all Google Trends specific ways to slice the data
        """
        if type(keywords) not in (type([]), type(('tuple',))):
            keywords = [keywords]
        params = urllib.urlencode({
            'export': 1,
            'content': 1,
            'cmpt': 'q',
            'q': ",".join(keywords),
            'date': date,
            'geo': geo,
        })
        self.raw_data = self.opener.open(self.url_Export+ params).read()
        if self.raw_data in ['You must be signed in to export data from Google Trends']:
            raise Exception(self.raw_data)
        return self.raw_data
        