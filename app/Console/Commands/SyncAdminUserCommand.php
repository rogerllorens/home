<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class SyncAdminUserCommand extends Command
{
    protected $signature = 'admin:sync';
    protected $description = 'Create or update the admin user from .env credentials';

    public function handle(): int
    {
        $email = config('admin.credentials.email');
        $password = config('admin.credentials.password');

        if (!$email || !$password) {
            $this->error('ADMIN_EMAIL and ADMIN_PASSWORD must be set.');
            return self::FAILURE;
        }

        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => 'Admin',
                'password' => Hash::make($password),
                'is_admin' => true,
            ]
        );

        $this->info("Admin user synced: {$user->email}");

        return self::SUCCESS;
    }
}
