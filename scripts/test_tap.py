import urllib.request
import urllib.parse
import json

def get_simbad_data():
    url = "https://simbad.cds.unistra.fr/simbad/sim-tap/sync"
    
    adql = "SELECT TOP 1 * FROM allfluxes"
    
    print("Testing ADQL:", adql)
    data = urllib.parse.urlencode({
        'request': 'doQuery',
        'lang': 'adql',
        'format': 'json',
        'query': adql.strip()
    }).encode('utf-8')

    try:
        req = urllib.request.Request(url, data=data)
        response = urllib.request.urlopen(req)
        
        out = response.read().decode('utf-8')
        d = json.loads(out)
        
        if len(d['data']) > 0:
            print("Successfully found data via TAP:")
            print(json.dumps(d['metadata'], indent=2))
        else:
            print("No data found")
            
    except urllib.error.HTTPError as e:
        print("TAP Error HTTP:", e.code, e.read().decode('utf-8'))
    except Exception as e:
        print("TAP Error:", e)

get_simbad_data()
