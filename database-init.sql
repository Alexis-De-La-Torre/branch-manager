create database branch_manager;

create table users(
    email text not null,
    hash text not null,
    full_name text not null,
    rfc text not null,
    company_name text not null
);

-- contrasena = "secreto"
insert into users values (
    'gerencia@solucionesrc.com',
    'df733656293a19c54f69093ba916f0a1a2a3c151fc95c13f3a794c2631eeb3a6',
    'Marcos Ramirez',
    'ENTR595886IO7',
    'Soluciones RC'
);

create table branches(
    id serial primary key,
    user_email text not null,
    name text not null,
    address text not null,
    colonia text not null,
    pc int not null,
    city text not null,
    country text not null
);

insert into branches values(
    '1',
    'gerencia@solucionesrc.com',
    'Guadalajara Sur',
    'Martinez 123',
    'Del Rio',
    22930,
    'Guadalajara',
    'Mexico'
);

insert into branches values(
    '2',
    'gerencia@solucionesrc.com',
    'Guadalajara Norte',
    'Arquitectos 123',
    'Esperanza',
    22950,
    'Guadalajara',
    'Mexico'
);

create table employees(
    id serial primary key,
    user_email text not null,
    name text not null,
    rfc text not null,
    branch_id text not null,
    job text not null
);

insert into employees values(
    '1',
    'gerencia@solucionesrc.com',
    'Carla Espinoza',
    'NXQC43203453X',
    '1',
    'Gerente General'
);

insert into employees values(
    '2',
    'gerencia@solucionesrc.com',
    'Arath Martinez',
    'AEHE265693NE3',
    '1',
    'Gerente de Produccion'
);