/**
 * Major US cities for the location autocomplete (~380 entries,
 * every state covered, all large freight hubs included).
 *
 * The fields are freeSolo: any text still works — the backend
 * geocodes free text via Nominatim — this list is a convenience
 * layer, not a constraint.
 */
const US_CITIES = [
  // Alabama
  'Birmingham, AL', 'Huntsville, AL', 'Mobile, AL', 'Montgomery, AL', 'Tuscaloosa, AL',
  // Alaska
  'Anchorage, AK', 'Fairbanks, AK', 'Juneau, AK',
  // Arizona
  'Chandler, AZ', 'Flagstaff, AZ', 'Gilbert, AZ', 'Glendale, AZ', 'Mesa, AZ',
  'Phoenix, AZ', 'Scottsdale, AZ', 'Tempe, AZ', 'Tucson, AZ', 'Yuma, AZ',
  // Arkansas
  'Fayetteville, AR', 'Fort Smith, AR', 'Little Rock, AR', 'Springdale, AR',
  // California
  'Anaheim, CA', 'Bakersfield, CA', 'Chula Vista, CA', 'Fontana, CA', 'Fresno, CA',
  'Irvine, CA', 'Long Beach, CA', 'Los Angeles, CA', 'Modesto, CA', 'Oakland, CA',
  'Ontario, CA', 'Oxnard, CA', 'Redding, CA', 'Riverside, CA', 'Sacramento, CA',
  'Salinas, CA', 'San Bernardino, CA', 'San Diego, CA', 'San Francisco, CA',
  'San Jose, CA', 'Santa Ana, CA', 'Santa Barbara, CA', 'Santa Rosa, CA', 'Stockton, CA',
  // Colorado
  'Aurora, CO', 'Boulder, CO', 'Colorado Springs, CO', 'Denver, CO',
  'Fort Collins, CO', 'Grand Junction, CO', 'Pueblo, CO',
  // Connecticut
  'Bridgeport, CT', 'Hartford, CT', 'New Haven, CT', 'Stamford, CT', 'Waterbury, CT',
  // Delaware
  'Dover, DE', 'Wilmington, DE',
  // Florida
  'Cape Coral, FL', 'Fort Lauderdale, FL', 'Fort Myers, FL', 'Gainesville, FL',
  'Hialeah, FL', 'Jacksonville, FL', 'Lakeland, FL', 'Miami, FL', 'Naples, FL',
  'Ocala, FL', 'Orlando, FL', 'Pensacola, FL', 'Port St. Lucie, FL',
  'St. Petersburg, FL', 'Tallahassee, FL', 'Tampa, FL', 'West Palm Beach, FL',
  // Georgia
  'Albany, GA', 'Atlanta, GA', 'Athens, GA', 'Augusta, GA', 'Columbus, GA',
  'Macon, GA', 'Savannah, GA', 'Valdosta, GA',
  // Hawaii
  'Hilo, HI', 'Honolulu, HI',
  // Idaho
  'Boise, ID', 'Idaho Falls, ID', 'Pocatello, ID', 'Twin Falls, ID',
  // Illinois
  'Aurora, IL', 'Bloomington, IL', 'Champaign, IL', 'Chicago, IL', 'Joliet, IL',
  'Naperville, IL', 'Peoria, IL', 'Rockford, IL', 'Springfield, IL',
  // Indiana
  'Evansville, IN', 'Fort Wayne, IN', 'Gary, IN', 'Indianapolis, IN',
  'Lafayette, IN', 'South Bend, IN', 'Terre Haute, IN',
  // Iowa
  'Cedar Rapids, IA', 'Council Bluffs, IA', 'Davenport, IA', 'Des Moines, IA',
  'Iowa City, IA', 'Sioux City, IA', 'Waterloo, IA',
  // Kansas
  'Kansas City, KS', 'Overland Park, KS', 'Salina, KS', 'Topeka, KS', 'Wichita, KS',
  // Kentucky
  'Bowling Green, KY', 'Lexington, KY', 'Louisville, KY', 'Owensboro, KY', 'Paducah, KY',
  // Louisiana
  'Baton Rouge, LA', 'Lafayette, LA', 'Lake Charles, LA', 'Monroe, LA',
  'New Orleans, LA', 'Shreveport, LA',
  // Maine
  'Bangor, ME', 'Portland, ME',
  // Maryland
  'Annapolis, MD', 'Baltimore, MD', 'Frederick, MD', 'Hagerstown, MD',
  // Massachusetts
  'Boston, MA', 'Cambridge, MA', 'Lowell, MA', 'Springfield, MA', 'Worcester, MA',
  // Michigan
  'Ann Arbor, MI', 'Detroit, MI', 'Flint, MI', 'Grand Rapids, MI', 'Kalamazoo, MI',
  'Lansing, MI', 'Saginaw, MI', 'Warren, MI',
  // Minnesota
  'Duluth, MN', 'Minneapolis, MN', 'Rochester, MN', 'St. Cloud, MN', 'St. Paul, MN',
  // Mississippi
  'Biloxi, MS', 'Gulfport, MS', 'Hattiesburg, MS', 'Jackson, MS', 'Meridian, MS',
  // Missouri
  'Columbia, MO', 'Independence, MO', 'Joplin, MO', 'Kansas City, MO',
  'Springfield, MO', 'St. Joseph, MO', 'St. Louis, MO',
  // Montana
  'Billings, MT', 'Bozeman, MT', 'Butte, MT', 'Great Falls, MT', 'Missoula, MT',
  // Nebraska
  'Grand Island, NE', 'Lincoln, NE', 'North Platte, NE', 'Omaha, NE',
  // Nevada
  'Carson City, NV', 'Elko, NV', 'Henderson, NV', 'Las Vegas, NV', 'Reno, NV',
  // New Hampshire
  'Concord, NH', 'Manchester, NH', 'Nashua, NH',
  // New Jersey
  'Atlantic City, NJ', 'Camden, NJ', 'Elizabeth, NJ', 'Jersey City, NJ',
  'Newark, NJ', 'Paterson, NJ', 'Trenton, NJ',
  // New Mexico
  'Albuquerque, NM', 'Gallup, NM', 'Las Cruces, NM', 'Roswell, NM', 'Santa Fe, NM',
  // New York
  'Albany, NY', 'Binghamton, NY', 'Buffalo, NY', 'New York, NY', 'Rochester, NY',
  'Syracuse, NY', 'Utica, NY', 'Yonkers, NY',
  // North Carolina
  'Asheville, NC', 'Charlotte, NC', 'Durham, NC', 'Fayetteville, NC',
  'Greensboro, NC', 'Raleigh, NC', 'Wilmington, NC', 'Winston-Salem, NC',
  // North Dakota
  'Bismarck, ND', 'Fargo, ND', 'Grand Forks, ND', 'Minot, ND',
  // Ohio
  'Akron, OH', 'Cincinnati, OH', 'Cleveland, OH', 'Columbus, OH', 'Dayton, OH',
  'Toledo, OH', 'Youngstown, OH',
  // Oklahoma
  'Lawton, OK', 'Norman, OK', 'Oklahoma City, OK', 'Tulsa, OK',
  // Oregon
  'Bend, OR', 'Eugene, OR', 'Medford, OR', 'Portland, OR', 'Salem, OR',
  // Pennsylvania
  'Allentown, PA', 'Erie, PA', 'Harrisburg, PA', 'Philadelphia, PA',
  'Pittsburgh, PA', 'Reading, PA', 'Scranton, PA',
  // Rhode Island
  'Providence, RI', 'Warwick, RI',
  // South Carolina
  'Charleston, SC', 'Columbia, SC', 'Greenville, SC', 'Myrtle Beach, SC', 'Spartanburg, SC',
  // South Dakota
  'Pierre, SD', 'Rapid City, SD', 'Sioux Falls, SD',
  // Tennessee
  'Chattanooga, TN', 'Clarksville, TN', 'Jackson, TN', 'Knoxville, TN',
  'Memphis, TN', 'Murfreesboro, TN', 'Nashville, TN',
  // Texas
  'Abilene, TX', 'Amarillo, TX', 'Arlington, TX', 'Austin, TX', 'Beaumont, TX',
  'Brownsville, TX', 'Corpus Christi, TX', 'Dallas, TX', 'El Paso, TX',
  'Fort Worth, TX', 'Houston, TX', 'Laredo, TX', 'Lubbock, TX', 'McAllen, TX',
  'Midland, TX', 'Odessa, TX', 'Plano, TX', 'San Antonio, TX', 'Texarkana, TX',
  'Tyler, TX', 'Waco, TX', 'Wichita Falls, TX',
  // Utah
  'Ogden, UT', 'Provo, UT', 'Salt Lake City, UT', 'St. George, UT',
  // Vermont
  'Burlington, VT', 'Montpelier, VT',
  // Virginia
  'Alexandria, VA', 'Chesapeake, VA', 'Norfolk, VA', 'Richmond, VA',
  'Roanoke, VA', 'Virginia Beach, VA',
  // Washington
  'Bellevue, WA', 'Everett, WA', 'Seattle, WA', 'Spokane, WA',
  'Tacoma, WA', 'Vancouver, WA', 'Yakima, WA',
  // West Virginia
  'Charleston, WV', 'Huntington, WV', 'Morgantown, WV', 'Wheeling, WV',
  // Wisconsin
  'Appleton, WI', 'Eau Claire, WI', 'Green Bay, WI', 'Kenosha, WI',
  'Madison, WI', 'Milwaukee, WI',
  // Wyoming
  'Casper, WY', 'Cheyenne, WY', 'Laramie, WY', 'Rock Springs, WY',
  // DC
  'Washington, DC',
].sort((a, b) => a.localeCompare(b));

export default US_CITIES;