-- ⚽ Seed Data: 48 FIFA World Cup 2026 Teams
-- Groups A through L (4 teams each)

INSERT INTO public.teams (name, code, flag_emoji, group_name) VALUES
-- Group A
('Morocco', 'MAR', '🇲🇦', 'A'),
('Croatia', 'CRO', '🇭🇷', 'A'),
('Scotland', 'SCO', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'A'),
('Peru', 'PER', '🇵🇪', 'A'),

-- Group B
('Spain', 'ESP', '🇪🇸', 'B'),
('Ecuador', 'ECU', '🇪🇨', 'B'),
('Paraguay', 'PAR', '🇵🇾', 'B'),
('Uzbekistan', 'UZB', '🇺🇿', 'B'),

-- Group C
('Argentina', 'ARG', '🇦🇷', 'C'),
('Egypt', 'EGY', '🇪🇬', 'C'),
('Indonesia', 'IDN', '🇮🇩', 'C'),
('Bosnia and Herzegovina', 'BIH', '🇧🇦', 'C'),

-- Group D
('France', 'FRA', '🇫🇷', 'D'),
('Colombia', 'COL', '🇨🇴', 'D'),
('Saudi Arabia', 'KSA', '🇸🇦', 'D'),
('Bahrain', 'BHR', '🇧🇭', 'D'),

-- Group E
('Brazil', 'BRA', '🇧🇷', 'E'),
('Australia', 'AUS', '🇦🇺', 'E'),
('Tunisia', 'TUN', '🇹🇳', 'E'),
('Honduras', 'HON', '🇭🇳', 'E'),

-- Group F
('Portugal', 'POR', '🇵🇹', 'F'),
('Mexico', 'MEX', '🇲🇽', 'F'),
('Türkiye', 'TUR', '🇹🇷', 'F'),
('Kenya', 'KEN', '🇰🇪', 'F'),

-- Group G
('Germany', 'GER', '🇩🇪', 'G'),
('Chile', 'CHI', '🇨🇱', 'G'),
('Japan', 'JPN', '🇯🇵', 'G'),
('Canada', 'CAN', '🇨🇦', 'G'),

-- Group H
('England', 'ENG', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'H'),
('Senegal', 'SEN', '🇸🇳', 'H'),
('Haiti', 'HAI', '🇭🇹', 'H'),
('Wales', 'WAL', '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'H'),

-- Group I
('Uruguay', 'URU', '🇺🇾', 'I'),
('Iran', 'IRN', '🇮🇷', 'I'),
('South Korea', 'KOR', '🇰🇷', 'I'),
('Trinidad and Tobago', 'TRI', '🇹🇹', 'I'),

-- Group J
('Belgium', 'BEL', '🇧🇪', 'J'),
('Nigeria', 'NGA', '🇳🇬', 'J'),
('Costa Rica', 'CRC', '🇨🇷', 'J'),
('Albania', 'ALB', '🇦🇱', 'J'),

-- Group K
('Netherlands', 'NED', '🇳🇱', 'K'),
('Cameroon', 'CMR', '🇨🇲', 'K'),
('Panama', 'PAN', '🇵🇦', 'K'),
('Serbia', 'SRB', '🇷🇸', 'K'),

-- Group L
('USA', 'USA', '🇺🇸', 'L'),
('Bolivia', 'BOL', '🇧🇴', 'L'),
('Italy', 'ITA', '🇮🇹', 'L'),
('Slovenia', 'SVN', '🇸🇮', 'L')
ON CONFLICT (code) DO NOTHING;


-- ============================================================
-- Seed Data: 6 Prediction Questions
-- ============================================================
INSERT INTO public.questions (question_number, title, description, max_points, lock_date) VALUES
(1, 'World Cup Winner', 'Predict which team will lift the FIFA World Cup 2026 trophy', 50, '2026-07-19T12:00:00+05:30'),
(2, 'Runner-Up', 'Predict the team that will finish in 2nd place', 14, '2026-07-19T12:00:00+05:30'),
(3, 'Third-Place Team', 'Predict the team that will finish in 3rd place', 11, '2026-07-19T12:00:00+05:30'),
(4, 'Golden Boot Winner', 'Predict the top goal scorer of the tournament', 7, '2026-07-19T12:00:00+05:30'),
(5, 'Golden Glove Winner', 'Predict the best goalkeeper of the tournament', 7, '2026-07-19T12:00:00+05:30'),
(6, 'Final Match Score', 'Predict the exact score of the Final match (After 90 Minutes)', 11, '2026-07-19T12:00:00+05:30')
ON CONFLICT (question_number) DO UPDATE SET max_points = EXCLUDED.max_points;


-- ============================================================
-- Seed Data: Notable Players (for Golden Boot / Golden Glove)
-- ============================================================

-- Argentina
INSERT INTO public.players (name, team_code, position, is_goalkeeper) VALUES
('Lionel Messi', 'ARG', 'FW', false),
('Julián Álvarez', 'ARG', 'FW', false),
('Lautaro Martínez', 'ARG', 'FW', false),
('Paulo Dybala', 'ARG', 'FW', false),
('Ángel Di María', 'ARG', 'FW', false),
('Emiliano Martínez', 'ARG', 'GK', true),

-- Brazil
('Vinícius Júnior', 'BRA', 'FW', false),
('Rodrygo', 'BRA', 'FW', false),
('Endrick', 'BRA', 'FW', false),
('Raphinha', 'BRA', 'FW', false),
('Alisson Becker', 'BRA', 'GK', true),
('Éderson', 'BRA', 'GK', true),

-- France
('Kylian Mbappé', 'FRA', 'FW', false),
('Antoine Griezmann', 'FRA', 'FW', false),
('Ousmane Dembélé', 'FRA', 'FW', false),
('Olivier Giroud', 'FRA', 'FW', false),
('Mike Maignan', 'FRA', 'GK', true),

-- England
('Harry Kane', 'ENG', 'FW', false),
('Jude Bellingham', 'ENG', 'MF', false),
('Bukayo Saka', 'ENG', 'FW', false),
('Phil Foden', 'ENG', 'MF', false),
('Cole Palmer', 'ENG', 'FW', false),
('Jordan Pickford', 'ENG', 'GK', true),

-- Portugal
('Cristiano Ronaldo', 'POR', 'FW', false),
('Bruno Fernandes', 'POR', 'MF', false),
('Rafael Leão', 'POR', 'FW', false),
('Bernardo Silva', 'POR', 'MF', false),
('Diogo Costa', 'POR', 'GK', true),

-- Spain
('Lamine Yamal', 'ESP', 'FW', false),
('Dani Olmo', 'ESP', 'MF', false),
('Álvaro Morata', 'ESP', 'FW', false),
('Nico Williams', 'ESP', 'FW', false),
('Unai Simón', 'ESP', 'GK', true),

-- Germany
('Jamal Musiala', 'GER', 'MF', false),
('Florian Wirtz', 'GER', 'MF', false),
('Kai Havertz', 'GER', 'FW', false),
('Leroy Sané', 'GER', 'FW', false),
('Manuel Neuer', 'GER', 'GK', true),
('Marc-André ter Stegen', 'GER', 'GK', true),

-- Netherlands
('Cody Gakpo', 'NED', 'FW', false),
('Memphis Depay', 'NED', 'FW', false),
('Xavi Simons', 'NED', 'MF', false),

-- Belgium
('Romelu Lukaku', 'BEL', 'FW', false),
('Kevin De Bruyne', 'BEL', 'MF', false),
('Jérémy Doku', 'BEL', 'FW', false),
('Thibaut Courtois', 'BEL', 'GK', true),

-- Italy
('Federico Chiesa', 'ITA', 'FW', false),
('Gianluca Scamacca', 'ITA', 'FW', false),
('Gianluigi Donnarumma', 'ITA', 'GK', true),

-- Croatia
('Luka Modrić', 'CRO', 'MF', false),
('Andrej Kramarić', 'CRO', 'FW', false),
('Dominik Livaković', 'CRO', 'GK', true),

-- Uruguay
('Darwin Núñez', 'URU', 'FW', false),
('Federico Valverde', 'URU', 'MF', false),
('Luis Suárez', 'URU', 'FW', false),

-- Colombia
('Luis Díaz', 'COL', 'FW', false),
('James Rodríguez', 'COL', 'MF', false),
('Rafael Santos Borré', 'COL', 'FW', false),

-- Mexico
('Hirving Lozano', 'MEX', 'FW', false),
('Santiago Giménez', 'MEX', 'FW', false),
('Guillermo Ochoa', 'MEX', 'GK', true),

-- USA
('Christian Pulisic', 'USA', 'FW', false),
('Timothy Weah', 'USA', 'FW', false),
('Matt Turner', 'USA', 'GK', true),

-- Japan
('Takefusa Kubo', 'JPN', 'FW', false),
('Kaoru Mitoma', 'JPN', 'FW', false),

-- South Korea
('Son Heung-min', 'KOR', 'FW', false),
('Hwang Hee-chan', 'KOR', 'FW', false),
('Kim Seung-gyu', 'KOR', 'GK', true),

-- Senegal
('Sadio Mané', 'SEN', 'FW', false),
('Ismaïla Sarr', 'SEN', 'FW', false),
('Édouard Mendy', 'SEN', 'GK', true),

-- Nigeria
('Victor Osimhen', 'NGA', 'FW', false),
('Ademola Lookman', 'NGA', 'FW', false),

-- Morocco
('Achraf Hakimi', 'MAR', 'DF', false),
('Youssef En-Nesyri', 'MAR', 'FW', false),
('Yassine Bounou', 'MAR', 'GK', true),

-- Cameroon
('André-Frank Zambo Anguissa', 'CMR', 'MF', false),
('Eric Maxim Choupo-Moting', 'CMR', 'FW', false),

-- Egypt
('Mohamed Salah', 'EGY', 'FW', false),
('Mohamed El-Shenawy', 'EGY', 'GK', true),

-- Ecuador
('Moisés Caicedo', 'ECU', 'MF', false),
('Enner Valencia', 'ECU', 'FW', false),

-- Türkiye
('Hakan Çalhanoğlu', 'TUR', 'MF', false),
('Arda Güler', 'TUR', 'MF', false),

-- Canada
('Alphonso Davies', 'CAN', 'DF', false),
('Jonathan David', 'CAN', 'FW', false),

-- Chile
('Alexis Sánchez', 'CHI', 'FW', false),

-- Australia
('Mathew Ryan', 'AUS', 'GK', true),

-- Serbia
('Dušan Vlahović', 'SRB', 'FW', false),
('Aleksandar Mitrović', 'SRB', 'FW', false),

-- Iran
('Mehdi Taremi', 'IRN', 'FW', false),
('Alireza Beiranvand', 'IRN', 'GK', true),

-- Saudi Arabia
('Salem Al-Dawsari', 'KSA', 'FW', false),

-- Tunisia
('Youssef Msakni', 'TUN', 'FW', false);
