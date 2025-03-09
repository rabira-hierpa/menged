import pandas as pd
import geopandas as gpd
from sqlalchemy import create_engine
from shapely.geometry import Point, LineString

# Database connection details
db_params = {
    'dbname': 'gtfs_dev_db',
    'user': 'admin',
    'password': 'adminpassword',
    'host': 'localhost',
    'port': 5432
}

# Create a SQLAlchemy engine
engine = create_engine(
    f"postgresql://{db_params['user']}:{db_params['password']}@{db_params['host']}:{db_params['port']}/{db_params['dbname']}")

# Define the paths to your GTFS data
gtfs_path = "addis-ababa-gtfs-2023/"

# Import stops
stops_df = pd.read_csv(gtfs_path + 'stops.txt')
stops_df['location'] = stops_df.apply(
    lambda row: Point(row['stop_lon'], row['stop_lat']), axis=1)
stops_gdf = gpd.GeoDataFrame(stops_df, geometry='location', crs='EPSG:4326')
stops_gdf[['stop_id', 'stop_name', 'stop_lat', 'stop_lon', 'location']].to_postgis('stops', con=create_engine(
    f"postgresql://{db_params['user']}:{db_params['password']}@{db_params['host']}:{db_params['port']}/{db_params['dbname']}"), if_exists='append', index=False)

# Import routes
routes_df = pd.read_csv(gtfs_path + 'routes.txt')
routes_df[['route_id', 'route_short_name', 'route_long_name', 'route_type']].to_sql('routes', con=create_engine(
    f"postgresql://{db_params['user']}:{db_params['password']}@{db_params['host']}:{db_params['port']}/{db_params['dbname']}"), if_exists='append', index=False)

# Import trips
trips_df = pd.read_csv(gtfs_path + 'trips.txt')
trips_df[['trip_id', 'route_id', 'shape_id']].to_sql('trips', con=create_engine(
    f"postgresql://{db_params['user']}:{db_params['password']}@{db_params['host']}:{db_params['port']}/{db_params['dbname']}"), if_exists='append', index=False)

# Import shapes
shapes_df = pd.read_csv(gtfs_path + 'shapes.txt')
shapes_df['location'] = shapes_df.apply(lambda row: Point(
    row['shape_pt_lon'], row['shape_pt_lat']), axis=1)
shapes_gdf = gpd.GeoDataFrame(shapes_df, geometry='location', crs='EPSG:4326')
shapes_gdf[['shape_id', 'shape_pt_lat', 'shape_pt_lon', 'shape_pt_sequence', 'location']].to_postgis('shapes', con=create_engine(
    f"postgresql://{db_params['user']}:{db_params['password']}@{db_params['host']}:{db_params['port']}/{db_params['dbname']}"), if_exists='append', index=False)
