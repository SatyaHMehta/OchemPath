-- Create universities table and seed with common Texas universities
create table if not exists universities (
  id serial primary key,
  name text not null,
  created_at timestamptz default now()
);

-- Seed a practical list of Texas universities
insert into universities (name) values
('University of Texas at Austin'),
('Texas A&M University'),
('Rice University'),
('University of Houston'),
('University of Houston - Downtown'),
('Texas State University'),
('Texas Southern University'),
('University of Texas at Arlington'),
('University of Texas at El Paso'),
('University of Texas at Tyler'),
('University of Texas Rio Grande Valley'),
('Texas A&M University - Commerce'),
('Texas A&M University - Corpus Christi'),
('Texas A&M University - Kingsville'),
('Sam Houston State University'),
('Stephen F. Austin State University'),
('Lamar University'),
('Prairie View A&M University'),
('Angelo State University'),
('Midwestern State University'),
('West Texas A&M University'),
('Texas Tech University'),
('Baylor University'),
('Southern Methodist University'),
('University of North Texas'),
('University of Texas at Dallas'),
('University of Texas at San Antonio')
on conflict do nothing;
